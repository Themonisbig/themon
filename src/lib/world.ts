import {random} from 'remotion';

/** Simple pinhole projection of the arena floor onto the 1080x1920 stage. */
export const HORIZON_Y = 640;
export const NEAR_Y = 1500;
export const DEPTH_K = 3.2;
export const FIELD_HALF_W = 640;
export const FINISH_Z = 1;

export const project = (x: number, z: number) => {
  const d = 1 + z * DEPTH_K;
  return {
    x: 540 + (x * FIELD_HALF_W) / d,
    y: HORIZON_Y + (NEAR_Y - HORIZON_Y) / d,
    s: 1 / d,
  };
};

export const PLAYER_COLORS = ['#22e0ff', '#ff3fb4', '#ffb020', '#f5f5f5', '#8c5bff', '#ff6a2b', '#3d7bff', '#ffe23d'];

export type PlayerSpec = {
  id: number;
  num: number;
  x: number;
  z0: number;
  color: string;
  speed: number;
  phase: number;
};

/** 50 deterministic players (numbers are 3-digit "bibs"). */
export const PLAYERS: PlayerSpec[] = Array.from({length: 50}, (_, i) => {
  const row = Math.floor(i / 10);
  const col = i % 10;
  return {
    id: i,
    num: i === 4 ? 27 : i === 27 ? 404 : ((i * 83 + 11) % 456) + 1,
    x: -0.88 + col * 0.196 + (random(`px${i}`) - 0.5) * 0.12,
    z0: 0.04 + row * 0.07 + random(`pz${i}`) * 0.05,
    color: PLAYER_COLORS[Math.floor(random(`pc${i}`) * PLAYER_COLORS.length)],
    speed: 0.8 + random(`ps${i}`) * 0.45,
    phase: random(`pp${i}`) * Math.PI * 2,
  };
});
