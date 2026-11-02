import React from 'react';

export type GiftKind = 'rose' | 'star' | 'crown';

/** Generic gift icons drawn in code (no real platform artwork). Size ≈ 100 units, centred at 0,0. */
export const GiftIcon: React.FC<{kind: GiftKind; size?: number; x?: number; y?: number; rot?: number; glow?: number}> = ({
  kind,
  size = 100,
  x = 0,
  y = 0,
  rot = 0,
  glow = 1,
}) => {
  const s = size / 100;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${s})`}>
      <circle r={62} fill={kind === 'rose' ? '#ff2a55' : '#ffc83a'} opacity={0.22 * glow} />
      <circle r={44} fill={kind === 'rose' ? '#ff2a55' : '#ffc83a'} opacity={0.18 * glow} />
      {kind === 'rose' && <Rose />}
      {kind === 'star' && <Star />}
      {kind === 'crown' && <Crown />}
    </g>
  );
};

const Rose = () => (
  <g>
    <path d="M 0 10 Q -4 40 4 60" stroke="#1fa64a" strokeWidth={7} fill="none" strokeLinecap="round" />
    <path d="M 2 38 Q 22 26 30 38 Q 18 48 2 42 Z" fill="#2fd162" />
    <path d="M -36 -6 Q -40 -40 -10 -44 Q 0 -60 14 -44 Q 42 -40 36 -6 Q 30 22 0 26 Q -30 22 -36 -6 Z" fill="#e0123f" />
    <path d="M -22 -10 Q -24 -34 0 -34 Q 24 -34 22 -10 Q 14 10 0 10 Q -14 10 -22 -10 Z" fill="#ff3b63" />
    <path d="M -10 -14 Q -8 -28 6 -24 Q 14 -12 2 -6 Q -6 -2 -10 -14 Z" fill="#9e0026" />
    <path d="M -30 -30 Q -20 -40 -6 -36" stroke="#ff9db0" strokeWidth={4} fill="none" strokeLinecap="round" />
  </g>
);

const starPts = (r1: number, r2: number) =>
  Array.from({length: 10}, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? r2 : r1;
    return `${Math.cos(a) * r},${Math.sin(a) * r}`;
  }).join(' ');

const Star = () => (
  <g>
    <polygon points={starPts(50, 22)} fill="#ffb300" stroke="#fff3b0" strokeWidth={4} strokeLinejoin="round" />
    <polygon points={starPts(32, 14)} fill="#ffe25a" />
    <circle cx={-12} cy={-14} r={6} fill="#fff" opacity={0.8} />
  </g>
);

const Crown = () => (
  <g>
    <path d="M -48 26 L -52 -22 L -26 2 L 0 -38 L 26 2 L 52 -22 L 48 26 Z" fill="#ffc21a" stroke="#fff1b0" strokeWidth={4} strokeLinejoin="round" />
    <rect x={-50} y={22} width={100} height={18} rx={5} fill="#e19a00" />
    <circle cx={0} cy={-38} r={7} fill="#ff2a55" />
    <circle cx={-52} cy={-22} r={6} fill="#3df0ff" />
    <circle cx={52} cy={-22} r={6} fill="#3df0ff" />
    <circle cx={0} cy={31} r={6} fill="#ff2a55" />
    <circle cx={-26} cy={31} r={5} fill="#39ff6a" />
    <circle cx={26} cy={31} r={5} fill="#39ff6a" />
  </g>
);
