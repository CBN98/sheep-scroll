import type { SoundMode } from '../state/store';

// Everything is synthesized with Web Audio — no sound files to host.
// Browsers only allow audio after a user gesture, so unlock() runs on first touch.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let layer: { stop: () => void } | null = null;
let builtMode: SoundMode = 'off';

const config = { mode: 'off' as SoundMode, volume: 0.5, dimmed: false };

function brownNoise(ac: AudioContext) {
  const len = ac.sampleRate * 8;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

function lfo(ac: AudioContext, rate: number, depth: number, target: AudioParam) {
  const osc = ac.createOscillator();
  const amt = ac.createGain();
  osc.frequency.value = rate;
  amt.gain.value = depth;
  osc.connect(amt).connect(target);
  osc.start();
  return osc;
}

// Brahms' Lullaby (public domain) as [note, beats]; null = rest.
const LULLABY: [string | null, number][] = [
  ['E4', 0.5], ['E4', 0.5], ['G4', 2], ['E4', 0.5], ['E4', 0.5], ['G4', 2],
  ['E4', 0.5], ['G4', 0.5], ['C5', 1], ['B4', 1.5], ['A4', 0.5], ['A4', 1], ['G4', 1],
  ['D4', 0.5], ['E4', 0.5], ['F4', 1], ['D4', 1], ['D4', 0.5], ['E4', 0.5], ['F4', 2],
  ['D4', 0.5], ['F4', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 1], ['B4', 1], ['C5', 2], [null, 1],
  ['C4', 0.5], ['C4', 0.5], ['C5', 2], ['A4', 0.5], ['F4', 0.5], ['G4', 2],
  ['E4', 0.5], ['C4', 0.5], ['F4', 1], ['G4', 1], ['A4', 1], ['G4', 2],
  ['C4', 0.5], ['C4', 0.5], ['C5', 2], ['A4', 0.5], ['F4', 0.5], ['G4', 2],
  ['E4', 0.5], ['C4', 0.5], ['F4', 1], ['E4', 0.5], ['D4', 0.5], ['C4', 3], [null, 4],
];
const BEAT = 60 / 58; // seconds per beat — slow

function noteFreq(name: string) {
  const steps: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  const octave = Number(name.slice(-1));
  return 440 * 2 ** ((steps[name[0]] + (octave - 4) * 12) / 12);
}

// A tiny generated reverb so the music box sounds like it's in a quiet room.
function reverb(ac: AudioContext, seconds = 2.8) {
  const len = ac.sampleRate * seconds;
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  const conv = ac.createConvolver();
  conv.buffer = buf;
  return conv;
}

// One music-box "tine": a bright attack with a long, soft decay.
function pluck(ac: AudioContext, out: AudioNode, freq: number, when: number, level: number) {
  [[1, 1, 2.6], [2, 0.25, 1.2], [3.01, 0.08, 0.5]].forEach(([mult, gain, decay]) => {
    const osc = ac.createOscillator();
    osc.frequency.value = freq * mult;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(level * gain, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    osc.connect(g).connect(out);
    osc.start(when);
    osc.stop(when + decay + 0.05);
  });
}

function musicBox(ac: AudioContext, out: AudioNode) {
  const bus = ac.createGain();
  const wet = ac.createGain();
  wet.gain.value = 0.4;
  const verb = reverb(ac);
  bus.connect(out);
  bus.connect(verb).connect(wet).connect(out);

  // Look-ahead scheduler: queue notes ~1s ahead so timing stays steady.
  let index = 0;
  let next = ac.currentTime + 0.5;
  const tick = () => {
    while (next < ac.currentTime + 1) {
      const [note, beats] = LULLABY[index];
      if (note) {
        const f = noteFreq(note) * 2; // up an octave: music-box register
        pluck(ac, bus, f, next, 0.09);
        if (beats >= 2) pluck(ac, bus, f / 2, next, 0.05); // soft doubling on long notes
      }
      next += beats * BEAT;
      index = (index + 1) % LULLABY.length;
    }
  };
  tick();
  const id = window.setInterval(tick, 200);
  return () => {
    clearInterval(id);
    bus.disconnect();
    wet.disconnect();
  };
}

function buildLayer(ac: AudioContext, out: AudioNode, mode: SoundMode) {
  const nodes: (AudioScheduledSourceNode)[] = [];
  const cleanups: (() => void)[] = [];

  // Wind: brown noise through a slowly breathing low-pass filter.
  if (mode === 'wind' || mode === 'dreamy') {
    const noise = brownNoise(ac);
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const windGain = ac.createGain();
    windGain.gain.value = mode === 'dreamy' ? 0.35 : 0.6;
    noise.connect(filter).connect(windGain).connect(out);
    noise.start();
    nodes.push(noise, lfo(ac, 0.05, 160, filter.frequency), lfo(ac, 0.07, 0.2, windGain.gain));
  }

  // Dreamy: a soft, slowly shimmering A-major pad on top.
  if (mode === 'dreamy') {
    const padFilter = ac.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 900;
    padFilter.connect(out);
    [110, 164.81, 220, 277.18].forEach((freq, i) => {
      const osc = ac.createOscillator();
      osc.frequency.value = freq;
      const g = ac.createGain();
      g.gain.value = 0.035;
      osc.connect(g).connect(padFilter);
      osc.start();
      nodes.push(osc, lfo(ac, 0.06 + i * 0.023, 0.025, g.gain));
    });
  }

  // Lullaby: just the slow music box.
  if (mode === 'lullaby') cleanups.push(musicBox(ac, out));

  return {
    stop: () => {
      nodes.forEach((n) => n.stop());
      cleanups.forEach((fn) => fn());
    },
  };
}

function apply(fadeSeconds: number) {
  if (!ctx || !master) return;
  if (config.mode !== builtMode) {
    layer?.stop();
    layer = config.mode === 'off' ? null : buildLayer(ctx, master, config.mode);
    builtMode = config.mode;
  }
  const target = config.mode === 'off' || config.dimmed ? 0 : config.volume * 0.6;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(target, now + fadeSeconds);
}

export const ambient = {
  unlock() {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      apply(3);
    }
    if (ctx.state === 'suspended') ctx.resume();
  },

  configure(mode: SoundMode, volume: number) {
    config.mode = mode;
    config.volume = volume;
    apply(1.5);
  },

  setDimmed(dimmed: boolean) {
    if (config.dimmed === dimmed) return;
    config.dimmed = dimmed;
    apply(dimmed ? 40 : 3);
  },

  // A soft two-note bell as a sheep lifts off.
  chime() {
    if (!ctx) return;
    const now = ctx.currentTime;
    [660, 990].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      osc.frequency.value = freq;
      const g = ctx!.createGain();
      const peak = (i === 0 ? 0.06 : 0.025) * (0.4 + config.volume);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(peak, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
      osc.connect(g).connect(ctx!.destination);
      osc.start(now);
      osc.stop(now + 3);
    });
  },
};
