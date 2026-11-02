import {GiftKind} from '../components/Gifts';
import {TL, f, FPS} from './anim';
import {PLAYERS, PlayerSpec} from './world';

export const KINDS: GiftKind[] = ['rose', 'star', 'rose', 'crown', 'star', 'rose', 'star', 'crown', 'rose', 'star', 'crown', 'star', 'rose', 'crown', 'star'];
const JUMP: Record<GiftKind, number> = {rose: 0.035, star: 0.06, crown: 0.1};

/** Which player each gift drop lands on (front rows, spread across the field). */
const TARGETS = [12, 25, 3, 18, 31, 7, 22, 15, 28, 1, 36, 9, 20, 14, 33];

export const DROPS = TL.gifts.drops.map((t, i) => ({
  frame: f(t),
  kind: KINDS[i % KINDS.length],
  target: TARGETS[i % TARGETS.length],
}));

export const ELIMINATED_ID = 4; // player #27 - keeps moving on RED LIGHT
export const GIFT_FALL = 14; // frames a gift takes to fall

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Deterministic simulation of a player's depth (0 = start line, 1 = finish). */
export const playerZ = (p: PlayerSpec, frame: number) => {
  const t = frame / FPS;
  const green = Math.max(0, Math.min(t, TL.scenes.green[1]) - 2.15);
  const walk = Math.max(0, Math.min(t, TL.scenes.red[0]) - TL.scenes.gifts[0]);
  let z = p.z0 + 0.085 * p.speed * green + 0.03 * p.speed * walk;
  for (const d of DROPS) {
    if (d.target !== p.id) continue;
    const k = clamp01((frame - d.frame) / 9);
    z += JUMP[d.kind] * (1 - Math.pow(1 - k, 2));
  }
  if (p.id === ELIMINATED_ID) {
    // the one who doesn't stop...
    const late = Math.max(0, Math.min(t, TL.red.caught) - TL.scenes.red[0]);
    z += 0.02 * late;
  }
  return z;
};

/** Vertical hop offset (in player units) when a gift lands on them. */
export const playerHop = (p: PlayerSpec, frame: number) => {
  let h = 0;
  for (const d of DROPS) {
    if (d.target !== p.id) continue;
    const k = (frame - d.frame) / 9;
    if (k > 0 && k < 1) h = Math.max(h, Math.sin(k * Math.PI) * (d.kind === 'crown' ? 120 : d.kind === 'star' ? 90 : 60));
  }
  return h;
};

/** Limb motion amount: sprint on green, walk during gifts, frozen on red. */
export const playerMoving = (p: PlayerSpec, frame: number) => {
  const t = frame / FPS;
  if (t < TL.scenes.green[0] + 0.15) return 0;
  if (t < TL.scenes.gifts[0]) return 1;
  if (t < TL.scenes.red[0]) return 0.55;
  if (p.id === ELIMINATED_ID && t < TL.red.caught + 0.2) return 0.35;
  return 0;
};

export const playerCycle = (p: PlayerSpec, frame: number) => (frame / FPS) * 15 * p.speed + p.phase;

export {PLAYERS};
