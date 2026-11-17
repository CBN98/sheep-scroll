import { useId } from 'react';
import type { Accessory, PatternKind, SheepLook } from './skins';

// Wool body is a cloud of circles; patterns are clipped to it.
const BODY: [number, number, number][] = [
  [60, 82, 28], [90, 68, 30], [122, 70, 28], [148, 88, 26], [142, 114, 26],
  [108, 122, 28], [74, 118, 27], [50, 102, 25], [100, 96, 42],
];
const TUFT: [number, number, number][] = [[88, 74, 11], [100, 68, 12], [112, 74, 11]];

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 110;
}

function starPath(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

function heartPath(cx: number, cy: number, s: number) {
  return `M${cx} ${cy + s * 0.9} C${cx - s * 1.6} ${cy - s * 0.2} ${cx - s * 0.6} ${cy - s * 1.3} ${cx} ${cy - s * 0.4} C${cx + s * 0.6} ${cy - s * 1.3} ${cx + s * 1.6} ${cy - s * 0.2} ${cx} ${cy + s * 0.9}Z`;
}

const SPOTS: [number, number][] = [[58, 84], [132, 74], [150, 106], [70, 120], [118, 128], [84, 64], [46, 104]];

function Pattern({ kind, color }: { kind: PatternKind; color: string }) {
  switch (kind) {
    case 'spots':
      return <>{SPOTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={8} fill={color} opacity={0.85} />)}</>;
    case 'stripes':
      return <>{[60, 80, 100, 120, 140].map((y) => <rect key={y} x={0} y={y} width={200} height={8} fill={color} opacity={0.8} />)}</>;
    case 'stars':
      return <>{SPOTS.map(([x, y], i) => <path key={i} d={starPath(x, y, i % 2 ? 6 : 8)} fill={color} />)}</>;
    case 'hearts':
      return <>{SPOTS.map(([x, y], i) => <path key={i} d={heartPath(x, y, 6)} fill={color} opacity={0.9} />)}</>;
  }
}

function AccessoryFront({ kind, color }: { kind: Accessory; color: string }) {
  switch (kind) {
    case 'nightcap':
      return (
        <g>
          <path d="M80 76 Q86 46 112 40 Q134 36 146 52 Q128 48 118 62 L120 76 Z" fill={color} />
          <rect x={78} y={70} width={44} height={10} rx={5} fill="#f4efe6" />
          <circle cx={147} cy={53} r={7} fill="#f4efe6" />
        </g>
      );
    case 'crown':
      return (
        <g>
          <path d="M84 72 L86 52 L94 62 L100 48 L106 62 L114 52 L116 72 Z" fill={color} stroke="#c99a3c" strokeWidth={1.5} />
          <circle cx={100} cy={64} r={3} fill="#e86d8a" />
          <circle cx={90} cy={67} r={2} fill="#8fd3ff" />
          <circle cx={110} cy={67} r={2} fill="#8fd3ff" />
        </g>
      );
    case 'halo':
      return <ellipse cx={100} cy={50} rx={24} ry={6} fill="none" stroke={color} strokeWidth={4} opacity={0.95} />;
    case 'bow':
      return (
        <g transform="translate(120 70)">
          <path d="M0 0 L-12 -9 L-12 9 Z" fill={color} />
          <path d="M0 0 L12 -9 L12 9 Z" fill={color} />
          <circle r={3.5} fill={color} />
        </g>
      );
    case 'flower':
      return (
        <g transform="translate(121 70)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={0} cy={-6} rx={4} ry={6} fill={color} transform={`rotate(${a})`} />
          ))}
          <circle r={3.5} fill="#f2a65a" />
        </g>
      );
    case 'scarf':
      return (
        <g>
          <rect x={76} y={118} width={48} height={11} rx={5.5} fill={color} />
          <rect x={106} y={122} width={11} height={26} rx={4} fill={color} />
          <rect x={106} y={140} width={11} height={3} fill="#000" opacity={0.15} />
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path d="M74 100 Q74 58 100 58 Q126 58 126 100" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
          <rect x={66} y={92} width={13} height={20} rx={5} fill={color} />
          <rect x={121} y={92} width={13} height={20} rx={5} fill={color} />
        </g>
      );
  }
}

interface Props {
  look: SheepLook;
  silhouette?: boolean;
  className?: string;
}

export function Sheep({ look, silhouette, className }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const clip = `body-${uid}`;
  const shade = `shade-${uid}`;
  const glow = `glow-${uid}`;
  const eye = isDark(look.face) ? '#f4efe6' : '#2a2433';
  const accent = look.accessoryColor ?? '#ffd27a';

  return (
    <svg
      viewBox="0 0 200 170"
      className={className}
      style={silhouette ? { filter: 'brightness(0) invert(1)', opacity: 0.12 } : undefined}
      aria-hidden
    >
      <defs>
        <clipPath id={clip}>
          {BODY.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
        </clipPath>
        <linearGradient id={shade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.28} />
          <stop offset="1" stopColor="#000" stopOpacity={0.14} />
        </linearGradient>
        {look.glow && (
          <radialGradient id={glow}>
            <stop offset="0" stopColor={look.glow} stopOpacity={0.55} />
            <stop offset="1" stopColor={look.glow} stopOpacity={0} />
          </radialGradient>
        )}
      </defs>

      {look.glow && !silhouette && <circle cx={100} cy={95} r={98} fill={`url(#${glow})`} />}

      {/* legs */}
      {[70, 88, 106, 124].map((x) => <rect key={x} x={x} y={128} width={10} height={28} rx={5} fill={look.face} />)}

      {/* wool */}
      <g>
        {BODY.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={look.wool} />)}
        <g clipPath={`url(#${clip})`}>
          {look.pattern && <Pattern {...look.pattern} />}
          <rect width={200} height={170} fill={`url(#${shade})`} />
        </g>
      </g>

      {look.accessory === 'halo' && <AccessoryFront kind="halo" color={accent} />}

      {/* head */}
      <ellipse cx={74} cy={96} rx={14} ry={6} fill={look.face} transform="rotate(-18 74 96)" />
      <ellipse cx={126} cy={96} rx={14} ry={6} fill={look.face} transform="rotate(18 126 96)" />
      <ellipse cx={100} cy={102} rx={24} ry={28} fill={look.face} />
      {TUFT.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={look.wool} />)}

      {/* sleepy face */}
      <path d="M86 101 q5 4 10 0" fill="none" stroke={eye} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M104 101 q5 4 10 0" fill="none" stroke={eye} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={84} cy={112} r={4} fill="#ff9fb0" opacity={0.35} />
      <circle cx={116} cy={112} r={4} fill="#ff9fb0" opacity={0.35} />
      <path d="M96 116 q4 3 8 0" fill="none" stroke={eye} strokeWidth={2} strokeLinecap="round" opacity={0.8} />

      {look.accessory && look.accessory !== 'halo' && <AccessoryFront kind={look.accessory} color={accent} />}
    </svg>
  );
}
