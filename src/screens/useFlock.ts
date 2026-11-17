import { useCallback, useEffect, useRef, useState } from 'react';
import { TIMING } from '../config';

export type SheepState = 'entering' | 'idle' | 'floating';
export interface FlockSheep {
  key: number;
  skinId: string;
  state: SheepState;
  number?: number; // assigned when it lifts off
  lean?: number; // -1 (left) … 1 (right): which way it drifts as it floats up
}

// Turn a swipe/fling vector into a lean. Never exactly 0, so every float has a side.
export function leanFrom(dx: number, dy: number) {
  const lean = Math.max(-1, Math.min(1, (dx / Math.max(Math.abs(dy), 40)) * 1.2));
  return Math.abs(lean) < 0.05 ? randomLean() : lean;
}

export const randomLean = () => (Math.random() < 0.5 ? -0.3 : 0.3);

// The sleep loop: one sheep waits; a swipe sends it floating up; the next one
// fades in partway through. Swipes are only *triggers* — speed never changes.
export function useFlock(pickSkin: () => string, onLaunch: () => void) {
  const [flock, setFlock] = useState<FlockSheep[]>(() => [{ key: 0, skinId: pickSkin(), state: 'entering' }]);
  const flockRef = useRef(flock);
  const queued = useRef(0);
  const queuedLean = useRef(0);
  const nextKey = useRef(1);
  const launched = useRef(0);
  const timers = useRef<number[]>([]);
  const latest = useRef({ pickSkin, onLaunch });
  latest.current = { pickSkin, onLaunch };

  const update = useCallback((fn: (f: FlockSheep[]) => FlockSheep[]) => {
    flockRef.current = fn(flockRef.current);
    setFlock(flockRef.current);
  }, []);

  const spawn = useCallback(() => {
    update((f) => [...f, { key: nextKey.current++, skinId: latest.current.pickSkin(), state: 'entering' }]);
  }, [update]);

  const launch = useCallback(
    (key: number, lean: number) => {
      const number = ++launched.current;
      update((f) => f.map((s) => (s.key === key ? { ...s, state: 'floating', number, lean } : s)));
      latest.current.onLaunch();
      timers.current.push(window.setTimeout(spawn, TIMING.float * TIMING.spawnAt * 1000));
    },
    [update, spawn],
  );

  const request = useCallback(
    (lean: number) => {
      const idle = flockRef.current.find((s) => s.state === 'idle');
      if (idle) return launch(idle.key, lean);
      queued.current = Math.min(queued.current + 1, TIMING.maxQueue);
      queuedLean.current = lean;
    },
    [launch],
  );

  // A grabbed sheep thrown upward floats off right away, even mid-arrival.
  const fling = useCallback(
    (key: number, lean: number) => {
      const sheep = flockRef.current.find((s) => s.key === key);
      if (sheep && sheep.state !== 'floating') launch(key, lean);
    },
    [launch],
  );

  const arrived = useCallback(
    (key: number) => {
      if (flockRef.current.find((s) => s.key === key)?.state !== 'entering') return;
      update((f) => f.map((s) => (s.key === key ? { ...s, state: 'idle' } : s)));
      if (queued.current > 0) {
        queued.current--;
        launch(key, queuedLean.current);
      }
    },
    [update, launch],
  );

  const departed = useCallback((key: number) => update((f) => f.filter((s) => s.key !== key)), [update]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return { flock, request, fling, arrived, departed };
}
