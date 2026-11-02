import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {ArenaShot} from '../components/ArenaShot';
import {Caption} from '../components/Text';
import {GiftLegend, LiveBadge, LightPill} from '../components/Hud';
import {GiftIcon} from '../components/Gifts';
import {Burst} from '../components/Fx';
import {C} from '../theme';
import {FONT_DISPLAY} from '../fonts';
import {TL, f, slam, shake, punch, prog, easeIn} from '../lib/anim';
import {project, PLAYERS} from '../lib/world';
import {DROPS, GIFT_FALL, playerZ} from '../lib/sim';

const COMBO_COLORS = [C.green, C.gold, '#ff3fb4'];
const STEP_LABEL = {rose: '+1', star: '+5', crown: '+20'} as const;

/** 5–8s: gifts rain down, players they hit jump forward. Combo x5 / x10 / x20. */
export const Gifts: React.FC<{frame: number}> = ({frame}) => {
  const start = f(TL.scenes.gifts[0]);
  const combos = TL.gifts.combo.map(([t, n]) => ({at: f(t), n}));
  const cut1 = combos[1].at;
  const cut2 = combos[2].at;
  const sh = shake(frame, [...combos.map((c) => c.at), ...DROPS.map((d) => d.frame)], 14, 5);
  const pz = punch(frame, combos.map((c) => c.at), 0.09, 9);
  const midY = project(0, 0.5).y;
  const cam =
    frame < cut1
      ? {zoom: 1.32 + prog(frame, start, cut1) * 0.08 + pz, fx: 470, fy: midY + 60, sy: 1010}
      : frame < cut2
        ? {zoom: 1.6 + prog(frame, cut1, cut2) * 0.1 + pz, fx: 620, fy: midY + 40, sy: 1030}
        : {zoom: 1.04 + prog(frame, cut2, cut2 + 24) * 0.06 + pz, fx: 540, fy: 880, sy: 960};

  // gifts falling onto their target players (stage coordinates, inside camera)
  const gifts = DROPS.map((d, i) => {
    const t0 = d.frame - GIFT_FALL;
    if (frame < t0 || frame > d.frame + 22) return null;
    const p = PLAYERS[d.target];
    const land = project(p.x, playerZ(p, d.frame));
    const k = prog(frame, t0, d.frame, easeIn);
    const y = land.y - 900 * (1 - k) - 230 * land.s;
    const sz = 150 * Math.max(0.45, land.s * 1.6);
    const after = frame - d.frame;
    return (
      <g key={i}>
        {after < 0 && <GiftIcon kind={d.kind} x={land.x + (1 - k) * 60} y={y} size={sz} rot={(1 - k) * 220} />}
        <Burst x={land.x} y={land.y - 110 * land.s} t={after / 14} color={d.kind === 'rose' ? '#ff3b63' : C.gold} r={200 * land.s + 60} />
        {after >= 0 && (
          <text
            x={land.x}
            y={land.y - 230 * land.s - after * 5}
            textAnchor="middle"
            fontFamily={FONT_DISPLAY}
            fontSize={Math.max(46, 110 * land.s)}
            fill={d.kind === 'rose' ? '#ff7a95' : C.gold}
            stroke="#000"
            strokeWidth={6}
            paintOrder="stroke"
            opacity={1 - after / 22}
          >
            {STEP_LABEL[d.kind]}
          </text>
        )}
      </g>
    );
  });

  // decorative rain in screen space
  const rain = Array.from({length: 16}, (_, i) => {
    const kinds = ['rose', 'star', 'crown'] as const;
    const sp = 22 + random(`rv${i}`) * 18;
    const y = ((frame - start) * sp + random(`ry${i}`) * 2000) % 2200 - 200;
    const x = 40 + random(`rx${i}`) * 1000;
    return <GiftIcon key={i} kind={kinds[i % 3]} x={x} y={y} size={50 + random(`rs${i}`) * 50} rot={frame * (3 + i) + i * 40} glow={0.5} />;
  });

  const active = [...combos].reverse().find((c) => frame >= c.at);
  const ci = active ? combos.indexOf(active) : -1;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ArenaShot
        frame={frame}
        cam={cam}
        shake={sh}
        green={0.22}
        doll={{theta: 180}}
        over={<>{gifts}</>}
        look={(id) => {
          const hit = DROPS.find((d) => d.target === id && frame >= d.frame && frame < d.frame + 10);
          return hit ? {flash: 0.5 * (1 - (frame - hit.frame) / 10), flashColor: C.gold, glow: C.gold} : undefined;
        }}
      />
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.85}}>
        {rain}
      </svg>
      <LiveBadge frame={frame} />
      <LightPill state="green" />
      <GiftLegend t={prog(frame, start, start + 16)} />
      {active && (
        <>
          <Caption lines={['COMBO']} y={520} size={80} color={COMBO_COLORS[ci]} glow={COMBO_COLORS[ci]} tracking={14} scale={slam(frame, active.at, 1.4, 5)} />
          <Caption
            lines={[`X${active.n}!`]}
            y={700}
            size={300}
            color={COMBO_COLORS[ci]}
            glow={COMBO_COLORS[ci]}
            scale={slam(frame, active.at, 2.6, 6) * (1 + Math.sin(frame / 2) * 0.015)}
            rotate={-6 + ci * 3}
            rgbSplit={Math.max(0, 18 - (frame - active.at) * 3)}
          />
        </>
      )}
      {frame < combos[0].at && (
        <Caption lines={['SEND GIFTS', 'TO MOVE']} lineColors={[C.white, C.gold]} y={1330} size={130} glow={C.gold} scale={slam(frame, start + 2, 1.8, 6)} />
      )}
    </AbsoluteFill>
  );
};
