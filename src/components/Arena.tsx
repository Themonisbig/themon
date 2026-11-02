import React from 'react';
import {random} from 'remotion';
import {DEPTH_K, FIELD_HALF_W, HORIZON_Y, NEAR_Y, project} from '../lib/world';

type Props = {
  frame: number;
  spot?: number; // spotlight intensity 0..1
  red?: number; // red-light tint 0..1
  green?: number; // green-light tint 0..1
  gold?: number;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
};

/** Dark arena: perspective floor with neon lanes, back wall, spotlight cone, haze + dust. */
export const Arena: React.FC<Props> = ({frame, spot = 1, red = 0, green = 0, gold = 0, children, overlay}) => {
  const zs = Array.from({length: 14}, (_, i) => (i / 13) * 1.2);
  const lanes = Array.from({length: 11}, (_, i) => -1 + i * 0.2);
  const finish = project(0, 1);
  const finishL = project(-1, 1);
  const finishR = project(1, 1);
  const start = project(0, 0.02);
  const accent = red > green ? '#ff1f3d' : '#39ff6a';
  const accentAmt = Math.max(red, green);
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05030a" />
          <stop offset="0.75" stopColor="#120a1e" />
          <stop offset="1" stopColor="#1d1030" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1024" />
          <stop offset="0.35" stopColor="#0d0814" />
          <stop offset="1" stopColor="#050308" />
        </linearGradient>
        <radialGradient id="pool" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff4e0" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#ffe9c4" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffe9c4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cone" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff3dc" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff3dc" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff3dc" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="coneFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.35" />
        </linearGradient>
        <mask id="coneMask">
          <rect x="0" y="-400" width="1080" height="1500" fill="url(#coneFade)" />
        </mask>
        <radialGradient id="vig" cx="50%" cy="45%" r="75%">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a6aa8" stopOpacity="0" />
          <stop offset="0.5" stopColor="#8a6aa8" stopOpacity="0.12" />
          <stop offset="1" stopColor="#8a6aa8" stopOpacity="0" />
        </linearGradient>
        <filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* back wall */}
      <rect x={-600} y={-800} width={2280} height={HORIZON_Y + 800} fill="url(#wall)" />
      {/* wall pillars */}
      {[-520, -260, 0, 260, 520].map((dx, i) => (
        <g key={i} opacity={0.55}>
          <rect x={540 + dx - 34} y={80} width={68} height={HORIZON_Y - 80} fill="#0a0612" />
          <rect x={540 + dx - 34} y={80} width={6} height={HORIZON_Y - 80} fill={i % 2 ? '#ff1f3d' : '#39ff6a'} opacity={0.35} filter="url(#neon)" />
        </g>
      ))}
      {/* stands silhouettes */}
      {Array.from({length: 46}, (_, i) => {
        const x = -60 + i * 26;
        const h = 22 + random(`aud${i}`) * 26;
        const y = HORIZON_Y - 120 + Math.sin(i * 1.7) * 6;
        return <circle key={i} cx={x} cy={y - h * 0.2 + Math.sin(frame / 6 + i) * 2 * (green + red > 0 ? 1 : 0.2)} r={13} fill="#120b1b" />;
      })}
      <rect x={-600} y={HORIZON_Y - 104} width={2280} height={104} fill="#0d0716" />
      {/* neon wall strip */}
      <rect x={-600} y={HORIZON_Y - 108} width={2280} height={6} fill={accentAmt > 0.05 ? accent : '#5b2a7a'} opacity={0.6 + accentAmt * 0.4} filter="url(#neon)" />

      {/* floor */}
      <rect x={-600} y={HORIZON_Y} width={2280} height={NEAR_Y - HORIZON_Y + 400} fill="url(#floor)" />
      {/* lane lines converging to the doll */}
      {lanes.map((lx, i) => {
        const a = project(lx, 1.25);
        const b = project(lx * 1.25, -0.25);
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#39ff6a" strokeOpacity={0.09 + green * 0.18} strokeWidth={2} />;
      })}
      {zs.map((z, i) => {
        const a = project(-1.6, z);
        const b = project(1.6, z);
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#b07cff" strokeOpacity={0.07} strokeWidth={2 * a.s + 0.5} />;
      })}
      {/* start line */}
      <line x1={project(-1.3, 0.02).x} y1={start.y} x2={project(1.3, 0.02).x} y2={start.y} stroke="#39ff6a" strokeWidth={8} filter="url(#neon)" opacity={0.85} />
      {/* spotlight pool on floor around the doll */}
      <ellipse cx={540} cy={finish.y - 6} rx={560} ry={150} fill="url(#pool)" opacity={spot} />
      {/* finish line */}
      <g filter="url(#neon)">
        <line x1={finishL.x - 120} y1={finish.y} x2={finishR.x + 120} y2={finish.y} stroke="#ff1f3d" strokeWidth={9} />
      </g>
      {Array.from({length: 22}, (_, i) => (
        <rect
          key={i}
          x={finishL.x - 120 + i * ((finishR.x - finishL.x + 240) / 22)}
          y={finish.y + 6}
          width={(finishR.x - finishL.x + 240) / 44}
          height={8}
          fill="#fff"
          opacity={0.5}
        />
      ))}

      {children}

      {/* spotlight cone from above */}
      <g mask="url(#coneMask)" opacity={spot}>
        <polygon points={`470,-300 610,-300 ${540 + 420},${finish.y + 40} ${540 - 420},${finish.y + 40}`} fill="url(#cone)" />
      </g>
      {/* floating dust in the beam */}
      {Array.from({length: 40}, (_, i) => {
        const px = 540 + (random(`dx${i}`) - 0.5) * 520;
        const py = ((random(`dy${i}`) * 1200 + frame * (0.6 + random(`dv${i}`))) % 1200) - 150;
        return <circle key={i} cx={px + Math.sin(frame / 20 + i) * 10} cy={py} r={1.5 + random(`dr${i}`) * 2.5} fill="#fff" opacity={0.25 * spot} />;
      })}
      {/* haze band */}
      <rect x={-600} y={HORIZON_Y - 300} width={2280} height={600} fill="url(#haze)" />
      {/* colour washes */}
      {red > 0 && <rect x={-600} y={-800} width={2280} height={3600} fill="#ff0a2a" opacity={red * 0.28} style={{mixBlendMode: 'screen'}} />}
      {green > 0 && <rect x={-600} y={-800} width={2280} height={3600} fill="#1aff5a" opacity={green * 0.16} style={{mixBlendMode: 'screen'}} />}
      {gold > 0 && <rect x={-600} y={-800} width={2280} height={3600} fill="#ffc83a" opacity={gold * 0.3} style={{mixBlendMode: 'screen'}} />}
      {overlay}
    </svg>
  );
};

export {DEPTH_K, FIELD_HALF_W};
