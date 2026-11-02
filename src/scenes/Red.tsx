import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ArenaShot, DOLL_FOOT_Y} from '../components/ArenaShot';
import {LightSlam} from '../components/LightSlam';
import {Caption} from '../components/Text';
import {LiveBadge, LightPill} from '../components/Hud';
import {Puff, Stamp, ScreenFlash} from '../components/Fx';
import {C} from '../theme';
import {FONT_UI} from '../fonts';
import {TL, f, slam, shake, punch, prog, clamp, easeInOut, expoOut, lerp} from '../lib/anim';
import {project, PLAYERS} from '../lib/world';
import {ELIMINATED_ID, playerZ} from '../lib/sim';

export const EYE_Y = DOLL_FOOT_Y + (-1200 - 195) * 0.5;

/** 8–11s: music cuts. RED LIGHT. Doll spins, red scan beam, one player still moving: ELIMINATED. */
export const Red: React.FC<{frame: number}> = ({frame}) => {
  const start = f(TL.scenes.red[0]);
  const [s0, s1] = TL.red.spin.map(f);
  const [b0, b1] = TL.red.scan.map(f);
  const caught = f(TL.red.caught);
  const puffAt = f(TL.red.puff);
  const victim = PLAYERS[ELIMINATED_ID];
  const vz = playerZ(victim, Math.min(frame, caught));
  const vp = project(victim.x, vz);

  // doll spins around fast with an overshoot settle
  const spinK = prog(frame, s0, s1, easeInOut);
  const settle = frame > s1 ? Math.sin((frame - s1) * 0.9) * 10 * Math.exp(-(frame - s1) / 5) : 0;
  const theta = 180 - spinK * 180 + settle;
  const glow = interpolate(frame, [s1 - 2, s1 + 3], [0, 1.2], clamp);

  // camera: wide on doll -> scan -> slam in on the victim
  const focusK = prog(frame, caught - 2, caught + 6, expoOut);
  const zoom = lerp(1.04 + prog(frame, start, caught) * 0.1, 2.3, focusK) + punch(frame, [s1, caught, puffAt], 0.1, 9);
  const cam = {zoom, fx: lerp(540, vp.x, focusK), fy: lerp(800, vp.y - 120, focusK), sx: lerp(540, 520, focusK), sy: lerp(960, 1030, focusK)};
  const sh = shake(frame, [start, s1, caught, puffAt], 28, 6);

  // scan beam sweeping across the field
  const scanK = prog(frame, b0, b1);
  const beamOn = frame >= b0 && frame < b1 + 4;
  const sweepX = lerp(-260, 1340, (Math.sin((scanK - 0.5) * Math.PI) + 1) / 2);
  const beamFloorY = 1760;
  const inBeam = (x: number) => Math.abs(x - (540 + ((sweepX - 540) * (project(0, 0.3).y - EYE_Y)) / (beamFloorY - EYE_Y))) < 110;

  const vFlash = frame >= caught && frame < puffAt - 6 ? (Math.floor((frame - caught) / 2) % 2 ? 1 : 0.2) : 0;
  const vGray = interpolate(frame, [puffAt - 6, puffAt - 2], [0, 1], clamp);
  const puffT = (frame - puffAt) / 20;
  const capAt = b0 + 2;

  const beam = beamOn && (
    <g opacity={frame > b1 ? 1 - (frame - b1) / 4 : Math.min(1, (frame - b0) / 3)}>
      <polygon points={`530,${EYE_Y} 550,${EYE_Y} ${sweepX + 170},${beamFloorY} ${sweepX - 170},${beamFloorY}`} fill="#ff1f3d" opacity={0.26} />
      <polygon points={`536,${EYE_Y} 544,${EYE_Y} ${sweepX + 40},${beamFloorY} ${sweepX - 40},${beamFloorY}`} fill="#ff6070" opacity={0.45} />
      <line x1={540} y1={EYE_Y} x2={sweepX} y2={beamFloorY} stroke="#fff" strokeWidth={4} opacity={0.8} />
      <circle cx={540} cy={EYE_Y} r={36} fill="#ff1f3d" opacity={0.7} />
    </g>
  );
  const lock = frame >= caught && frame < puffAt && (
    <g>
      <rect
        x={vp.x - 130 * vp.s - 30}
        y={vp.y - 250 * vp.s - 30}
        width={260 * vp.s + 60}
        height={280 * vp.s + 50}
        fill="none"
        stroke={C.red}
        strokeWidth={6}
        strokeDasharray="30 14"
        opacity={vFlash > 0.5 ? 1 : 0.5}
      />
    </g>
  );

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ArenaShot
        frame={frame}
        cam={cam}
        shake={sh}
        red={0.55 + (beamOn ? 0.15 : 0)}
        spot={0.8}
        doll={{theta, eyeGlow: glow, redLight: 0.8}}
        over={
          <>
            {beam}
            {lock}
            <Puff x={vp.x} y={vp.y} t={puffT} scale={vp.s * 2.2} seed="victim" />
          </>
        }
        look={(id) => {
          if (id === ELIMINATED_ID) {
            if (frame >= puffAt + 2) return {hidden: true};
            return {flash: vFlash * 0.8, flashColor: '#fff', gray: vGray, glow: frame >= caught ? C.red : undefined};
          }
          const p = PLAYERS[id];
          const pr = project(p.x, playerZ(p, frame));
          return beamOn && inBeam(pr.x) ? {glow: '#ff1f3d'} : undefined;
        }}
      />
      <ScreenFlash color="#ff1f3d" opacity={frame >= caught && frame < caught + 4 ? 0.45 : 0} />
      <ScreenFlash color="#ffffff" opacity={frame >= puffAt && frame < puffAt + 3 ? 0.5 : 0} />
      <LiveBadge frame={frame} />
      {frame >= start + 8 && <LightPill state="red" scale={slam(frame, start + 8, 1.6, 6)} />}
      {frame >= caught && frame < puffAt && (
        <div
          style={{
            position: 'absolute',
            left: 64,
            width: 840,
            top: 560,
            textAlign: 'center',
            fontFamily: FONT_UI,
            fontWeight: 900,
            fontSize: 54,
            color: '#fff',
            opacity: vFlash > 0.5 ? 1 : 0.75,
          }}
        >
          <span style={{background: C.red, padding: '10px 26px', borderRadius: 14, boxShadow: `0 0 40px ${C.red}`}}>MOVEMENT DETECTED!</span>
        </div>
      )}
      {frame >= puffAt && <Stamp text="ELIMINATED" x={484} y={760} t={prog(frame, puffAt, puffAt + 6)} size={128} rot={-7} />}
      {frame >= capAt && (
        <Caption
          lines={['MOVE = OUT']}
          y={1340}
          size={175}
          color={C.white}
          lineColors={[undefined]}
          glow={C.red}
          stroke="#1a0004"
          scale={slam(frame, capAt, 2.2, 6) * (1 + punch(frame, [caught, puffAt], 0.05, 6))}
          rgbSplit={Math.max(0, 14 - (frame - capAt) * 2)}
        />
      )}
      <LightSlam frame={frame} at={start} kind="red" len={10} />
    </AbsoluteFill>
  );
};
