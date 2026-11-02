import React from 'react';
import {FONT_UI} from '../fonts';

export type PlayerProps = {
  x: number;
  y: number;
  scale: number;
  num: number | string;
  color: string;
  /** running cycle phase in radians; set `moving` 0 to freeze */
  cycle?: number;
  moving?: number; // 0..1 how much the limbs swing
  gray?: number; // 0..1 desaturate to gray
  flash?: number; // 0..1 white/red flash
  flashColor?: string;
  front?: boolean;
  armsUp?: number; // 0..1 celebration
  opacity?: number;
  glow?: string;
};

/** Simple numbered avatar seen from behind (bib on the back) or the front. */
export const Player: React.FC<PlayerProps> = ({
  x,
  y,
  scale,
  num,
  color,
  cycle = 0,
  moving = 1,
  gray = 0,
  flash = 0,
  flashColor = '#ffffff',
  front = false,
  armsUp = 0,
  opacity = 1,
  glow,
}) => {
  const swing = Math.sin(cycle) * 34 * moving;
  const bob = Math.abs(Math.sin(cycle)) * -10 * moving;
  const lean = moving * 6;
  const body = mix(color, '#7d7d84', gray);
  const skin = mix('#f0c9a6', '#9a9aa0', gray);
  const dark = mix('#1b1420', '#3c3c42', gray);
  const armL = armsUp > 0 ? -150 * armsUp + swing * (1 - armsUp) : swing;
  const armR = armsUp > 0 ? 150 * armsUp - swing * (1 - armsUp) : -swing;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity}>
      <ellipse cx={0} cy={0} rx={46} ry={11} fill="#000" opacity={0.55} />
      <g transform={`translate(0, ${bob}) rotate(${front ? 0 : -lean * 0}, 0, -60)`}>
        {glow && <ellipse cx={0} cy={-95} rx={70} ry={120} fill={glow} opacity={0.35} />}
        {/* legs */}
        <g transform={`rotate(${swing}, 0, -62)`}>
          <rect x={-22} y={-66} width={18} height={66} rx={9} fill={dark} />
        </g>
        <g transform={`rotate(${-swing}, 0, -62)`}>
          <rect x={4} y={-66} width={18} height={66} rx={9} fill={dark} />
        </g>
        {/* arms */}
        <g transform={`rotate(${armL}, -30, -128)`}>
          <rect x={-42} y={-132} width={15} height={58} rx={7.5} fill={body} />
          <circle cx={-34.5} cy={-74} r={8} fill={skin} />
        </g>
        <g transform={`rotate(${armR}, 30, -128)`}>
          <rect x={27} y={-132} width={15} height={58} rx={7.5} fill={body} />
          <circle cx={34.5} cy={-74} r={8} fill={skin} />
        </g>
        {/* torso */}
        <rect x={-33} y={-142} width={66} height={86} rx={22} fill={body} />
        <rect x={-33} y={-142} width={66} height={86} rx={22} fill="url(#playerShade)" />
        {/* bib */}
        <rect x={-23} y={-126} width={46} height={40} rx={6} fill="#fff" opacity={gray ? 0.75 : 0.95} />
        <text
          x={0}
          y={-95}
          textAnchor="middle"
          fontFamily={FONT_UI}
          fontWeight={900}
          fontSize={String(num).length > 2 ? 23 : 28}
          fill="#111"
        >
          {num}
        </text>
        {/* head */}
        <circle cx={0} cy={-166} r={25} fill={skin} />
        {front ? (
          <g>
            <path d="M -25 -172 Q 0 -206 25 -172 Q 18 -190 0 -192 Q -18 -190 -25 -172 Z" fill={dark} />
            <circle cx={-9} cy={-165} r={3.6} fill="#111" />
            <circle cx={9} cy={-165} r={3.6} fill="#111" />
            <path d={armsUp > 0.2 ? 'M -9 -154 Q 0 -144 9 -154' : 'M -7 -152 L 7 -152'} stroke="#111" strokeWidth={3} fill="none" strokeLinecap="round" />
          </g>
        ) : (
          <path d="M -25 -164 Q -26 -194 0 -192 Q 26 -194 25 -164 Q 0 -152 -25 -164 Z" fill={dark} />
        )}
        {flash > 0 && (
          <g opacity={flash}>
            <rect x={-44} y={-196} width={88} height={200} rx={40} fill={flashColor} />
          </g>
        )}
      </g>
    </g>
  );
};

/** Shared defs used by every <Player/> inside an <svg>. */
export const PlayerDefs: React.FC = () => (
  <defs>
    <linearGradient id="playerShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#000" stopOpacity="0.35" />
      <stop offset="0.45" stopColor="#fff" stopOpacity="0.12" />
      <stop offset="1" stopColor="#000" stopOpacity="0.4" />
    </linearGradient>
  </defs>
);

function mix(a: string, b: string, t: number) {
  if (t <= 0) return a;
  const pa = hex(a);
  const pb = hex(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.min(1, t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function hex(h: string) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
