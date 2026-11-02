import React from 'react';
import {Arena} from './Arena';
import {Camera} from './Camera';
import {Doll} from './Doll';
import {Player, PlayerDefs} from './Player';
import {project, PLAYERS} from '../lib/world';
import {playerCycle, playerHop, playerMoving, playerZ} from '../lib/sim';

export type PlayerLook = {gray?: number; flash?: number; flashColor?: string; hidden?: boolean; glow?: string};

export type ArenaShotProps = {
  frame: number;
  /** frame used for the player simulation (defaults to frame) */
  simFrame?: number;
  zBoost?: number;
  cam?: {zoom?: number; fx?: number; fy?: number; sx?: number; sy?: number};
  shake?: {x: number; y: number; r: number};
  doll?: {theta?: number; eyeGlow?: number; mouth?: number; scale?: number; redLight?: number};
  red?: number;
  green?: number;
  gold?: number;
  spot?: number;
  look?: (id: number) => PlayerLook | undefined;
  zOverride?: (id: number, z: number) => number;
  playersVisible?: (id: number) => boolean;
  movingOverride?: number;
  under?: React.ReactNode; // drawn between floor and players
  over?: React.ReactNode; // drawn above players, inside camera
  screen?: React.ReactNode; // drawn above, outside camera
};

export const DOLL_FOOT_Y = project(0, 1.06).y;

/** Arena + giant doll + all 50 players, framed by a camera. */
export const ArenaShot: React.FC<ArenaShotProps> = ({
  frame,
  simFrame,
  zBoost = 0,
  cam = {},
  shake = {x: 0, y: 0, r: 0},
  doll = {},
  red = 0,
  green = 0,
  gold = 0,
  spot = 1,
  look,
  zOverride,
  playersVisible,
  movingOverride,
  under,
  over,
  screen,
}) => {
  const ds = doll.scale ?? 0.5;
  const players = PLAYERS.filter((p) => (playersVisible ? playersVisible(p.id) : true))
    .map((p) => {
      const sf = simFrame ?? frame;
      let z = playerZ(p, sf) + zBoost;
      if (zOverride) z = zOverride(p.id, z);
      return {p, z};
    })
    .sort((a, b) => b.z - a.z);
  return (
    <>
      <Camera {...cam} shakeX={shake.x} shakeY={shake.y} rot={shake.r}>
        <Arena frame={frame} red={red} green={green} gold={gold} spot={spot}>
          <PlayerDefs />
          {/* doll shadow + doll */}
          <ellipse cx={540} cy={DOLL_FOOT_Y} rx={200 * ds * 2} ry={30} fill="#000" opacity={0.6} />
          <g transform={`translate(540, ${DOLL_FOOT_Y}) scale(${ds}) translate(0, -1200)`}>
            <Doll theta={doll.theta ?? 180} eyeGlow={doll.eyeGlow ?? 0} mouth={doll.mouth ?? 0} redLight={doll.redLight ?? red} id="arena" />
          </g>
          {under}
          {players.map(({p, z}) => {
            const pr = project(p.x, z);
            const lk = look?.(p.id) ?? {};
            if (lk.hidden) return null;
            return (
              <Player
                key={p.id}
                x={pr.x}
                y={pr.y - playerHop(p, simFrame ?? frame) * pr.s}
                scale={pr.s * 1.05}
                num={p.num}
                color={p.color}
                cycle={playerCycle(p, frame)}
                moving={movingOverride ?? playerMoving(p, simFrame ?? frame)}
                gray={lk.gray}
                flash={lk.flash}
                flashColor={lk.flashColor}
                glow={lk.glow}
              />
            );
          })}
          {over}
        </Arena>
      </Camera>
      {screen}
    </>
  );
};
