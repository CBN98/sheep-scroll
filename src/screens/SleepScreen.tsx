import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { TIMING } from '../config';
import { useStore } from '../state/store';
import { Sheep } from '../sheep/Sheep';
import { SKIN_BY_ID } from '../sheep/skins';
import { ambient } from '../audio/ambient';
import { haptics } from '../platform/haptics';
import { keepAwake } from '../platform/keepAwake';
import { useFlock } from './useFlock';
import { NightSky } from '../components/NightSky';

const SWIPE_MIN = 40; // px upward to count as a swipe
const WHEEL_MIN = 50;

const variants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.92 },
  shown: { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0, transition: { duration: TIMING.enter, ease: 'easeOut' } },
  float: (distance: number) => ({
    y: -distance,
    x: [0, 22, -16, 12, 0],
    rotate: [0, -5, 4, -2, 0],
    scale: 0.55,
    opacity: [1, 1, 0],
    transition: {
      duration: TIMING.float,
      ease: [0.45, 0, 0.55, 1],
      opacity: { duration: TIMING.float, times: [0, 0.55, 1] },
    },
  }),
};

interface Props {
  active: boolean;
  onOpenMenu: () => void;
}

export function SleepScreen({ active, onOpenMenu }: Props) {
  const settings = useStore((s) => s.settings);
  const wool = useStore((s) => s.wool);
  const countSheep = useStore((s) => s.countSheep);
  const [tonight, setTonight] = useState(0);
  const [dimmed, setDimmed] = useState(false);
  const lastTouch = useRef(Date.now());

  const pickSkin = useCallback(() => {
    const { owned, equipped, settings } = useStore.getState();
    if (settings.parade === 'favorite') return equipped;
    const ids = Object.keys(owned).filter((id) => owned[id] > 0 && SKIN_BY_ID[id]);
    return ids[Math.floor(Math.random() * ids.length)] ?? equipped;
  }, []);

  const onLaunch = useCallback(() => {
    const { settings } = useStore.getState();
    countSheep();
    setTonight((n) => n + 1);
    if (settings.haptics) haptics.puff();
    if (settings.chime) ambient.chime();
  }, [countSheep]);

  const { flock, request, arrived, departed } = useFlock(pickSkin, onLaunch);

  // Every interaction wakes the screen; while dimmed, the first touch only wakes it.
  const touch = useCallback(() => {
    lastTouch.current = Date.now();
    ambient.unlock();
    keepAwake.on();
    if (dimmed) {
      setDimmed(false);
      return false;
    }
    return true;
  }, [dimmed]);

  const swipe = useCallback(() => {
    if (touch()) request();
  }, [touch, request]);

  useEffect(() => ambient.setDimmed(dimmed), [dimmed]);

  // Idle dimming: fade to near-black and let the sound drift away.
  useEffect(() => {
    if (!active || !settings.idleDimMinutes) return;
    const id = window.setInterval(() => {
      if (Date.now() - lastTouch.current > settings.idleDimMinutes * 60_000) {
        setDimmed(true);
        keepAwake.off();
      }
    }, 5000);
    return () => clearInterval(id);
  }, [active, settings.idleDimMinutes]);

  // Laptop input: trackpad / wheel scrolling and keyboard.
  useEffect(() => {
    if (!active) return;
    let acc = 0;
    let lockedUntil = 0;
    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      if (now < lockedUntil) {
        lockedUntil = Math.max(lockedUntil, now + 250); // swallow trackpad momentum
        return;
      }
      acc = Math.max(0, acc + e.deltaY);
      if (acc >= WHEEL_MIN) {
        acc = 0;
        lockedUntil = now + 900;
        swipe();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'ArrowDown', 'PageDown', 'j'].includes(e.key)) {
        e.preventDefault();
        if (!e.repeat) swipe();
      } else {
        touch();
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, [active, swipe, touch]);

  // Touch / mouse swipe.
  const start = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    start.current = e.clientY;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dy = e.clientY - start.current;
    start.current = null;
    if (dy < -SWIPE_MIN) swipe();
    else touch();
  };

  const distance = typeof window !== 'undefined' ? window.innerHeight * 0.85 : 800;

  return (
    <div
      className="stage"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (start.current = null)}
    >
      <NightSky />

      <header className="topbar" style={{ opacity: dimmed ? 0 : 1 }}>
        <div className="wool-pill" aria-label={`${wool} wool`}>🧶 {wool}</div>
        <button
          className="icon-btn"
          aria-label="Menu"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={onOpenMenu}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
            <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor" />
          </svg>
        </button>
      </header>

      {flock.map((s) => (
        <div className="sheep-slot" key={s.key}>
          <motion.div
            variants={variants}
            initial="hidden"
            animate={s.state === 'floating' ? 'float' : 'shown'}
            custom={distance}
            onAnimationComplete={(def) => {
              if (def === 'shown') arrived(s.key);
              if (def === 'float') departed(s.key);
            }}
          >
            {settings.showCounter && s.number !== undefined && (
              <motion.div
                className="sheep-number"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: [0, 0.9, 0.9, 0], y: 0 }}
                transition={{ duration: TIMING.float * 0.9, times: [0, 0.2, 0.6, 1], ease: 'easeInOut' }}
              >
                {s.number}
              </motion.div>
            )}
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [0, 1.2, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sheep look={(SKIN_BY_ID[s.skinId] ?? SKIN_BY_ID.classic).look} className="sheep-svg" />
            </motion.div>
          </motion.div>
        </div>
      ))}

      <div className="hint" style={{ opacity: tonight < 3 && !dimmed ? 1 : 0 }}>
        <svg viewBox="0 0 24 24" width="22" height="22" className="hint-chevron" aria-hidden>
          <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>swipe up to count sheep</span>
        <span className="hint-sub">or scroll · press space</span>
      </div>

      <div className={`sleep-dim ${dimmed ? 'on' : ''}`} />
    </div>
  );
}
