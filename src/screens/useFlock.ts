import { useCallback, useEffect, useRef, useState } from 'react';
import { TIMING } from '../config';

export type SheepState = 'entering' | 'idle' | 'floating';
export interface FlockSheep {
  key: number;
  skinId: string;
  state: SheepState;
  number?: number; // assigned when it lifts off
}

// The sleep loop: one sheep waits; a swipe sends it floating up; the next one
// fades in partway through. Swipes are only *triggers* — speed never changes.
export function useFlock(pickSkin: () => string, onLaunch: () => void) {
  const [flock, setFlock] = useState<FlockSheep[]>(() => [{ key: 0, skinId: pickSkin(), state: 'entering' }]);
  const flockRef = useRef(flock);
  const queued = useRef(0);
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
    (key: number) => {
      const number = ++launched.current;
      update((f) => f.map((s) => (s.key === key ? { ...s, state: 'floating', number } : s)));
      latest.current.onLaunch();
      timers.current.push(window.setTimeout(spawn, TIMING.float * TIMING.spawnAt * 1000));
    },
    [update, spawn],
  );

  const request = useCallback(() => {
    const idle = flockRef.current.find((s) => s.state === 'idle');
    if (idle) launch(idle.key);
    else queued.current = Math.min(queued.current + 1, TIMING.maxQueue);
  }, [launch]);

  const arrived = useCallback(
    (key: number) => {
      if (flockRef.current.find((s) => s.key === key)?.state !== 'entering') return;
      update((f) => f.map((s) => (s.key === key ? { ...s, state: 'idle' } : s)));
      if (queued.current > 0) {
        queued.current--;
        launch(key);
      }
    },
    [update, launch],
  );

  const departed = useCallback((key: number) => update((f) => f.filter((s) => s.key !== key)), [update]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return { flock, request, arrived, departed };
}
