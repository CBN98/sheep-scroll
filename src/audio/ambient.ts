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

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// Ewes are low and throaty; lambs are high.
const sheepPitch = () => (Math.random() < 0.6 ? rand(190, 250) : rand(320, 420));

// A sheep's "meh-eh-eh-eh": a nasal "eh" vowel that wobbles in pitch and loudness
// together (the bleat), opening from an "m" and trailing off at the end.
function baa(ac: AudioContext, out: AudioNode, when: number, pitch: number) {
  const dur = rand(0.75, 1.1);
  const end = when + dur;

  // Two slightly detuned voices for a rough, organic buzz.
  const voices = [1, 1.012].map((detune) => {
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch * 0.82 * detune, when);
    osc.frequency.linearRampToValueAtTime(pitch * detune, when + 0.12);
    osc.frequency.setValueAtTime(pitch * detune, end - 0.35);
    osc.frequency.linearRampToValueAtTime(pitch * 0.8 * detune, end);
    return osc;
  });

  // The bleat: one wobble drives both pitch (±7%) and loudness, so each pulse goes "eh".
  const bleat = ac.createOscillator();
  bleat.frequency.setValueAtTime(rand(6, 7.5), when);
  bleat.frequency.linearRampToValueAtTime(rand(4.5, 5.5), end); // slows as it trails off
  const pitchWobble = ac.createGain();
  pitchWobble.gain.value = pitch * 0.07;
  bleat.connect(pitchWobble);
  voices.forEach((v) => pitchWobble.connect(v.frequency));

  const pulse = ac.createGain();
  pulse.gain.value = 0.55;
  const pulseDepth = ac.createGain();
  pulseDepth.gain.value = 0.45;
  bleat.connect(pulseDepth).connect(pulse.gain);
  voices.forEach((v) => v.connect(pulse));

  // Breath: a little noise under the voice.
  const breath = ac.createBufferSource();
  const len = Math.ceil(ac.sampleRate * (dur + 0.1));
  breath.buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = breath.buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const breathGain = ac.createGain();
  breathGain.gain.value = 0.04;
  breath.connect(breathGain).connect(pulse);

  // Mouth: closed "m" opening up, then closing again at the end.
  const mouth = ac.createBiquadFilter();
  mouth.type = 'lowpass';
  mouth.Q.value = 1.5;
  mouth.frequency.setValueAtTime(350, when);
  mouth.frequency.exponentialRampToValueAtTime(4000, when + 0.12);
  mouth.frequency.setValueAtTime(4000, end - 0.3);
  mouth.frequency.exponentialRampToValueAtTime(900, end);

  // Nasal "eh" vowel: formants around 600 / 1800 / 2700 Hz with a dip near 1 kHz.
  const nasal = ac.createBiquadFilter();
  nasal.type = 'peaking';
  nasal.frequency.value = 1000;
  nasal.Q.value = 2;
  nasal.gain.value = -12;
  pulse.connect(nasal).connect(mouth);

  const env = ac.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(1, when + 0.06);
  env.gain.setValueAtTime(1, end - 0.25);
  env.gain.linearRampToValueAtTime(0, end);
  env.connect(out);

  [[600, 5, 1], [1800, 7, 0.75], [2700, 9, 0.35]].forEach(([freq, q, gain]) => {
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ac.createGain();
    g.gain.value = gain;
    mouth.connect(bp).connect(g).connect(env);
  });
  const buzz = ac.createGain(); // a touch of unfiltered voice for body
  buzz.gain.value = 0.12;
  mouth.connect(buzz).connect(env);

  [...voices, bleat, breath].forEach((n) => {
    n.start(when);
    n.stop(end + 0.05);
  });
}

// A soft "hoo-hoo" from somewhere in the trees.
function owl(ac: AudioContext, out: AudioNode, when: number) {
  [[0, 0.35], [0.5, 0.7]].forEach(([offset, len]) => {
    const t = when + offset;
    const osc = ac.createOscillator();
    osc.frequency.setValueAtTime(390, t);
    osc.frequency.linearRampToValueAtTime(350, t + len);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1, t + 0.08);
    g.gain.linearRampToValueAtTime(0, t + len);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + len + 0.05);
  });
}

// A faraway "mmm-ooo": low voice with a filter that opens like a mouth.
function moo(ac: AudioContext, out: AudioNode, when: number) {
  const dur = rand(1.6, 2.2);
  const voice = ac.createOscillator();
  voice.type = 'sawtooth';
  voice.frequency.setValueAtTime(105, when);
  voice.frequency.linearRampToValueAtTime(135, when + dur * 0.35);
  voice.frequency.linearRampToValueAtTime(95, when + dur);
  const mouth = ac.createBiquadFilter();
  mouth.type = 'lowpass';
  mouth.Q.value = 4;
  mouth.frequency.setValueAtTime(250, when);
  mouth.frequency.linearRampToValueAtTime(800, when + dur * 0.4);
  mouth.frequency.linearRampToValueAtTime(350, when + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(1, when + 0.25);
  g.gain.setValueAtTime(1, when + dur - 0.5);
  g.gain.linearRampToValueAtTime(0, when + dur);
  voice.connect(mouth).connect(g).connect(out);
  voice.start(when);
  voice.stop(when + dur + 0.05);
}

// One cricket chirp: three quick high pulses.
function chirp(ac: AudioContext, out: AudioNode, when: number, freq: number) {
  for (let i = 0; i < 3; i++) {
    const t = when + i * 0.045;
    const osc = ac.createOscillator();
    osc.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1, t + 0.006);
    g.gain.linearRampToValueAtTime(0, t + 0.028);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + 0.03);
  }
}

function farm(ac: AudioContext, out: AudioNode) {
  // Animals sound far away: softened highs, mostly reverb.
  const animals = ac.createBiquadFilter();
  animals.type = 'lowpass';
  animals.frequency.value = 2200;
  const dry = ac.createGain();
  dry.gain.value = 0.35;
  const wet = ac.createGain();
  wet.gain.value = 0.6;
  animals.connect(dry).connect(out);
  animals.connect(reverb(ac, 3.5)).connect(wet).connect(out);

  const voice = (level: number) => {
    const g = ac.createGain();
    g.gain.value = level;
    g.connect(animals);
    return g;
  };
  const sheepBus = voice(0.5);
  const owlBus = voice(0.12);
  const cowBus = voice(0.35);

  const crickets = [
    { freq: 4300, pan: -0.6, every: 0.95, level: 0.02 },
    { freq: 4800, pan: 0.4, every: 1.2, level: 0.012 },
    { freq: 5200, pan: 0.75, every: 1.45, level: 0.007 },
  ].map((c) => {
    const panner = ac.createStereoPanner();
    panner.pan.value = c.pan;
    const g = ac.createGain();
    g.gain.value = c.level;
    g.connect(panner).connect(out);
    return { ...c, bus: g, panner, next: ac.currentTime + rand(0.2, 1.5) };
  });

  const now = ac.currentTime;
  let nextBaa = now + rand(8, 20);
  let nextOwl = now + rand(40, 90);
  let nextMoo = now + rand(70, 140);

  const tick = () => {
    const horizon = ac.currentTime + 1;
    for (const c of crickets) {
      while (c.next < horizon) {
        chirp(ac, c.bus, c.next, c.freq);
        c.next += c.every * rand(0.92, 1.08) + (Math.random() < 0.06 ? rand(2, 5) : 0); // the odd pause
      }
    }
    if (nextBaa < horizon) {
      baa(ac, sheepBus, nextBaa, sheepPitch());
      if (Math.random() < 0.35) baa(ac, sheepBus, nextBaa + rand(1.6, 2.6), sheepPitch()); // an answer
      nextBaa += rand(28, 70);
    }
    if (nextOwl < horizon) {
      owl(ac, owlBus, nextOwl);
      nextOwl += rand(90, 200);
    }
    if (nextMoo < horizon) {
      moo(ac, cowBus, nextMoo);
      nextMoo += rand(120, 260);
    }
  };
  tick();
  const id = window.setInterval(tick, 200);
  return () => {
    clearInterval(id);
    animals.disconnect();
    dry.disconnect();
    wet.disconnect();
    crickets.forEach((c) => c.panner.disconnect());
  };
}

function buildLayer(ac: AudioContext, out: AudioNode, mode: SoundMode) {
  const nodes: (AudioScheduledSourceNode)[] = [];
  const cleanups: (() => void)[] = [];

  // Wind: brown noise through a slowly breathing low-pass filter.
  if (mode === 'wind') {
    const noise = brownNoise(ac);
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const windGain = ac.createGain();
    windGain.gain.value = 0.6;
    noise.connect(filter).connect(windGain).connect(out);
    noise.start();
    nodes.push(noise, lfo(ac, 0.05, 160, filter.frequency), lfo(ac, 0.07, 0.2, windGain.gain));
  }

  // Farm: crickets with the odd distant sheep, owl and cow.
  if (mode === 'farm') cleanups.push(farm(ac, out));

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
