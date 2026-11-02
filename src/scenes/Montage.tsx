import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ArenaShot} from '../components/ArenaShot';
import {LightSlam} from '../components/LightSlam';
import {Caption} from '../components/Text';
import {Leaderboard, LiveBadge, LightPill} from '../components/Hud';
import {Puff, ScreenFlash} from '../components/Fx';
import {C} from '../theme';
import {TL, f, slam, shake, punch, prog, clamp, easeOut} from '../lib/anim';
import {project, PLAYERS} from '../lib/world';
import {playerZ} from '../lib/sim';

const PHASES = TL.montage.phases.map(([t, kind, count]) => ({at: f(t as number), kind: kind as 'green' | 'red', count: count as number}));
const visibleFor = (count: number) => Math.max(2, Math.round(count / 2));
// survivors: a fixed, spread-out order so the field thins out naturally
const ORDER = [7, 22, 13, 38, 2, 45, 16, 29, 9, 41, 33, 19, 5, 26, 48, 11, 36, 1, 23, 44, 14, 31, 8, 40, 18, 3, 27, 47, 12, 35, 21, 6, 42, 15, 30, 10, 39, 24, 46, 17, 34, 0, 28, 43, 20, 37, 25, 49, 32, 4];
const rankOf = (id: number) => ORDER.indexOf(id);

const ANGLES = [
  {zoom: 1.25, fx: 540, fy: 940, sy: 980},
  {zoom: 1.15, fx: 540, fy: 820, sy: 960},
  {zoom: 1.7, fx: 420, fy: 900, sy: 1000},
  {zoom: 1.4, fx: 540, fy: 760, sy: 920},
  {zoom: 1.9, fx: 640, fy: 860, sy: 1000},
  {zoom: 1.5, fx: 540, fy: 720, sy: 920},
  {zoom: 2.1, fx: 540, fy: 800, sy: 980},
];

/** 17–22s: rapid montage. GREEN/RED flashes, PLAYERS LEFT 100 → 47 → 12 → 3, leaderboard slides in. */
export const Montage: React.FC<{frame: number}> = ({frame}) => {
  const idx = PHASES.filter((p) => frame >= p.at).length - 1;
  const ph = PHASES[Math.max(0, idx)];
  const prev = PHASES[Math.max(0, idx - 1)];
  const local = frame - ph.at;
  const isRed = ph.kind === 'red';
  const lbAt = f(TL.montage.leaderboard);
  const reds = PHASES.filter((p) => p.kind === 'red').map((p) => p.at);
  const greens = PHASES.filter((p) => p.kind === 'green').map((p) => p.at);
  const sh = shake(frame, PHASES.map((p) => p.at), isRed ? 34 : 22, 6);

  // counter rolls down on each RED
  const shownCount = isRed && ph.count < prev.count ? Math.round(interpolate(local, [2, 12], [prev.count, ph.count], clamp)) : ph.count;
  const nowVisible = visibleFor(isRed ? prev.count : ph.count);
  const afterVisible = visibleFor(ph.count);
  const ang = ANGLES[idx % ANGLES.length];
  const cam = {...ang, zoom: ang.zoom * (1 + local * 0.004) + punch(frame, PHASES.map((p) => p.at), 0.1, 8)};
  const zBoost = 0.1 + idx * 0.07;
  const simFrame = isRed ? f(TL.scenes.gifts[0]) + 30 : f(TL.scenes.green[0]) + 30 + local;

  const puffs = isRed && ph.count < prev.count
    ? PLAYERS.filter((p) => rankOf(p.id) >= afterVisible && rankOf(p.id) < nowVisible).map((p, i) => {
        const pr = project(p.x, playerZ(p, simFrame) + zBoost);
        return <Puff key={p.id} x={pr.x} y={pr.y} t={(local - 4 - (i % 5)) / 16} scale={pr.s * 2.2} seed={`m${p.id}`} />;
      })
    : null;

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ArenaShot
        frame={frame}
        simFrame={simFrame}
        zBoost={zBoost}
        movingOverride={isRed ? 0 : 1}
        cam={cam}
        shake={sh}
        red={isRed ? 0.6 : 0}
        green={isRed ? 0 : 0.3}
        doll={{theta: isRed ? 0 : 180, eyeGlow: isRed ? 1.1 : 0, redLight: isRed ? 0.8 : 0}}
        playersVisible={(id) => rankOf(id) < (isRed && local >= 6 ? afterVisible : nowVisible)}
        look={(id) =>
          isRed && local < 6 && rankOf(id) >= afterVisible ? {flash: local % 2 ? 0.9 : 0.3, flashColor: '#fff', gray: local / 6} : undefined
        }
        over={<>{puffs}</>}
      />
      <ScreenFlash color={isRed ? '#ff1f3d' : '#39ff6a'} opacity={interpolate(local, [0, 5], [0.55, 0], clamp)} />
      <LiveBadge frame={frame} />
      <LightPill state={ph.kind} scale={slam(frame, ph.at, 1.5, 5)} />
      {/* PLAYERS LEFT counter */}
      <Caption lines={['PLAYERS LEFT']} y={400} size={78} tracking={10} color={isRed ? C.red : C.green} glow={isRed ? C.red : C.green} />
      <Caption
        lines={[String(shownCount)]}
        y={590}
        size={330}
        color={isRed ? '#fff' : '#eafff0'}
        glow={isRed ? C.red : C.green}
        stroke={isRed ? '#2a0007' : '#02200c'}
        scale={1 + punch(frame, reds, 0.35, 10) + punch(frame, greens, 0.1, 6)}
        rgbSplit={isRed ? Math.max(0, 20 - local * 2) : 0}
      />
      {frame >= lbAt && (
        <Leaderboard
          t={prog(frame, lbAt, lbAt + 24, easeOut)}
          frame={frame}
          y={850}
          rows={[
            {name: '@nova.k', num: 7, color: '#ffe23d', progress: 0.94},
            {name: '@lilmochi', num: 213, color: '#22e0ff', progress: 0.88},
            {name: '@dex_on_live', num: 88, color: '#ff3fb4', progress: 0.81},
            {name: '@saltyjay', num: 402, color: '#ff6a2b', progress: 0.66},
          ]}
        />
      )}
      <LightSlam frame={frame} at={ph.at} kind={ph.kind} len={5} size={250} />
    </AbsoluteFill>
  );
};
