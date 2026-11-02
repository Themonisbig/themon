import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ArenaShot} from '../components/ArenaShot';
import {Caption} from '../components/Text';
import {Player, PlayerDefs} from '../components/Player';
import {GiftIcon} from '../components/Gifts';
import {Confetti, ScreenFlash, SpeedLines} from '../components/Fx';
import {LiveBadge} from '../components/Hud';
import {C} from '../theme';
import {TL, f, slam, shake, punch, prog, clamp, lerp, easeIn, backOut} from '../lib/anim';
import {project} from '../lib/world';

const WINNER = 7; // player id whose bib we show

/** 22–26s: the last player crosses the finish line. Gold flash, confetti. "WINNER: @YOU?" */
export const Winner: React.FC<{frame: number}> = ({frame}) => {
  const start = f(TL.scenes.winner[0]);
  const cross = f(TL.winner.cross);
  const capAt = cross + 6;
  const cut2 = cross + 50;
  const sh = shake(frame, [start, cross, capAt], 30, 7);

  if (frame < cross) {
    // approach: winner sprinting the last metres, two rivals behind
    const k = prog(frame, start, cross, easeIn);
    const zW = lerp(0.72, 1.0, k);
    const pr = project(-0.05, zW);
    const zoom = lerp(2.5, 3.3, k);
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <ArenaShot
          frame={frame}
          simFrame={f(TL.scenes.green[0]) + 40}
          movingOverride={1}
          zBoost={0.42}
          cam={{zoom, fx: pr.x, fy: pr.y - 70, sy: 1020}}
          shake={sh}
          green={0.3}
          doll={{theta: 0, eyeGlow: 1, redLight: 0.3}}
          playersVisible={(id) => id === 11 || id === 18}
          over={
            <Player x={pr.x} y={pr.y} scale={pr.s * 1.1} num={7} color="#ffe23d" cycle={frame * 0.9} moving={1} glow={C.gold} />
          }
        />
        <SpeedLines frame={frame} opacity={0.5} color="#fff3c4" cy={760} />
        <LiveBadge frame={frame} />
        <Caption lines={['FINAL STRETCH']} lineColors={[C.gold]} y={1440} size={130} glow={C.gold} scale={slam(frame, start + 2, 1.8, 6)} />
      </AbsoluteFill>
    );
  }

  // celebration close-up
  const local = frame - cross;
  const zoom = frame < cut2 ? 1 + local * 0.003 : 1.18 + (frame - cut2) * 0.004;
  const rays = (frame * 0.6) % 360;
  const crownK = prog(frame, cross + 8, cross + 20, backOut);
  const gold = interpolate(local, [0, 3, 14], [1, 0.9, 0], clamp);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 42%, #5a3a05 0%, #1a0d02 45%, #050208 80%)'}}>
      <AbsoluteFill style={{transform: `scale(${zoom + punch(frame, [cross, cut2], 0.08, 8)}) translate(${sh.x}px, ${sh.y}px)`, transformOrigin: '50% 45%'}}>
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <PlayerDefs />
          <defs>
            <radialGradient id="rayfade" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#ffd75a" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffd75a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g transform={`translate(540, 820) rotate(${rays})`}>
            {Array.from({length: 18}, (_, i) => (
              <polygon key={i} points="0,0 -70,-1100 70,-1100" fill="url(#rayfade)" transform={`rotate(${i * 20})`} opacity={0.55} />
            ))}
          </g>
          {/* finish tape snapping */}
          {[-1, 1].map((s) => (
            <path
              key={s}
              d={`M ${540 + s * 20} 1080 Q ${540 + s * (200 + local * 8)} ${1080 + local * 4} ${540 + s * 640} ${1050 + local * 2}`}
              stroke={C.red}
              strokeWidth={16}
              fill="none"
              opacity={Math.max(0, 1 - local / 40)}
            />
          ))}
          <ellipse cx={540} cy={1230} rx={260} ry={40} fill="#000" opacity={0.5} />
          <Player x={540} y={1230} scale={3.4} num={7} color="#ffe23d" front armsUp={prog(frame, cross, cross + 8)} cycle={frame * 0.3} moving={0.15} glow={C.gold} />
          <GiftIcon kind="crown" x={540} y={lerp(80, 545, crownK)} size={230} rot={Math.sin(frame / 6) * 6} />
        </svg>
      </AbsoluteFill>
      <Confetti frameSince={local} origins={[{x: 80, y: 1500}, {x: 1000, y: 1500}, {x: 540, y: 300}]} count={70} />
      <ScreenFlash color={C.gold} opacity={gold} />
      <ScreenFlash color="#ffffff" opacity={interpolate(local, [0, 4], [0.8, 0], clamp)} />
      <LiveBadge frame={frame} />
      {frame >= capAt && (
        <Caption
          lines={['WINNER:', '@YOU?']}
          lineColors={[C.white, C.gold]}
          y={1360}
          size={180}
          glow={C.gold}
          stroke="#2a1600"
          scale={slam(frame, capAt, 2.4, 7) * (1 + Math.sin(frame / 4) * 0.012)}
          rgbSplit={Math.max(0, 14 - (frame - capAt) * 2)}
        />
      )}
    </AbsoluteFill>
  );
};
