import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Caption} from './Text';
import {C} from '../theme';
import {slam, prog} from '../lib/anim';

/** Full-screen GREEN LIGHT / RED LIGHT slam on a flashing colour field. */
export const LightSlam: React.FC<{frame: number; at: number; kind: 'green' | 'red'; len?: number; size?: number}> = ({
  frame,
  at,
  kind,
  len = 14,
  size = 300,
}) => {
  const d = frame - at;
  if (d < 0 || d >= len) return null;
  const col = kind === 'green' ? C.green : C.red;
  const deep = kind === 'green' ? '#03250f' : '#2a0007';
  const strobe = d < 2 ? 1 : d % 4 < 2 ? 0.85 : 0.55;
  const out = prog(frame, at + len - 4, at + len);
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, ${col} 0%, ${deep} 85%)`, opacity: strobe}} />
      <AbsoluteFill style={{background: d < 2 ? '#fff' : 'transparent', opacity: d < 2 ? 0.7 : 0}} />
      <Caption
        lines={kind === 'green' ? ['GREEN', 'LIGHT'] : ['RED', 'LIGHT']}
        y={860}
        size={size}
        color={kind === 'green' ? '#eafff0' : '#fff'}
        stroke={kind === 'green' ? '#02200c' : '#1a0004'}
        glow={col}
        scale={slam(frame, at, 2.8, 6)}
        rgbSplit={Math.max(0, 22 - d * 3)}
        lineHeight={0.88}
        tracking={4}
      />
    </AbsoluteFill>
  );
};
