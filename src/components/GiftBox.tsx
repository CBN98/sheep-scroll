import { motion } from 'motion/react';

interface Props {
  color: string;
  ribbon: string;
  open?: boolean;
  className?: string;
}

export function GiftBox({ color, ribbon, open = false, className }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden style={{ overflow: 'visible' }}>
      <rect x={18} y={52} width={84} height={58} rx={8} fill={color} />
      <rect x={18} y={52} width={84} height={58} rx={8} fill="#000" opacity={0.12} />
      <rect x={54} y={52} width={12} height={58} fill={ribbon} />
      <motion.g
        animate={open ? { y: -70, rotate: -18, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        style={{ originX: '60px', originY: '46px' }}
      >
        <rect x={12} y={38} width={96} height={18} rx={6} fill={color} />
        <rect x={54} y={38} width={12} height={18} fill={ribbon} />
        <path d="M60 38 C44 18 30 30 46 38 Z" fill={ribbon} />
        <path d="M60 38 C76 18 90 30 74 38 Z" fill={ribbon} />
        <circle cx={60} cy={37} r={5} fill={ribbon} />
      </motion.g>
    </svg>
  );
}
