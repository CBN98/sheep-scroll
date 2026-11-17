import { memo, useMemo } from 'react';

export const NightSky = memo(function NightSky() {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 70,
        size: Math.random() < 0.85 ? 1.5 : 2.5,
        delay: Math.random() * 8,
        duration: 4 + Math.random() * 6,
      })),
    [],
  );

  return (
    <div className="sky" aria-hidden>
      <div className="moon" />
      {stars.map((s) => (
        <span
          key={s.id}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
      <svg className="hills" viewBox="0 0 400 120" preserveAspectRatio="none">
        <path d="M0 70 Q80 30 170 60 T400 50 V120 H0 Z" fill="#141a38" />
        <path d="M0 95 Q120 60 230 88 T400 80 V120 H0 Z" fill="#0e1330" />
      </svg>
    </div>
  );
});
