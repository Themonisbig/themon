import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ArenaShot} from '../components/ArenaShot';
import {LightSlam} from '../components/LightSlam';
import {Caption} from '../components/Text';
import {LiveBadge, LightPill} from '../components/Hud';
import {SpeedLines} from '../components/Fx';
import {C} from '../theme';
import {TL, f, slam, shake, punch, clamp, prog, easeOut} from '../lib/anim';
import {project} from '../lib/world';

/** 2–5s: GREEN LIGHT slams, 50 players sprint. "YOUR GIFTS = YOUR STEPS" */
export const Green: React.FC<{frame: number}> = ({frame}) => {
  const start = f(TL.scenes.green[0]);
  const cutB = start + 46;
  const capAt = start + 14;
  const sh = shake(frame, [start, capAt, cutB], 30, 6);
  const isB = frame >= cutB;
  const pz = punch(frame, [start + 14, cutB], 0.1, 10);
  const packY = project(0, 0.28 + (frame - start) * 0.0028).y;
  const cam = isB
    ? {zoom: 1.75 + prog(frame, cutB, cutB + 44, easeOut) * 0.25 + pz, fx: 540, fy: packY - 40, sx: 540, sy: 1000}
    : {zoom: 1.0 + prog(frame, start, cutB) * 0.1 + pz, fx: 540, fy: 900, sx: 540, sy: 960};
  const greenWash = interpolate(frame, [start, start + 20], [0.9, 0.25], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ArenaShot frame={frame} cam={cam} shake={sh} green={greenWash} doll={{theta: 180}} />
      {isB && <SpeedLines frame={frame} opacity={0.35} color="#bfffd0" cy={700} />}
      <LiveBadge frame={frame} opacity={interpolate(frame, [start + 10, start + 14], [0, 1], clamp)} />
      {frame >= start + 12 && <LightPill state="green" scale={slam(frame, start + 12, 1.6, 6)} />}
      {frame >= capAt && (
        <Caption
          lines={['YOUR GIFTS =', 'YOUR STEPS']}
          lineColors={[C.white, C.green]}
          y={1300}
          size={150}
          scale={slam(frame, capAt, 2.2, 7) * (1 + punch(frame, [cutB], 0.06, 8))}
          glow={C.green}
          rgbSplit={Math.max(0, 12 - (frame - capAt) * 2)}
        />
      )}
      <LightSlam frame={frame} at={start} kind="green" len={14} />
    </AbsoluteFill>
  );
};
