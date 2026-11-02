import {Easing, interpolate, random} from 'remotion';
import timeline from '../timeline.json';

export const TL = timeline;
export const FPS = timeline.fps;
/** seconds -> frame number */
export const f = (sec: number) => Math.round(sec * FPS);

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0..1 progress between two frames (clamped), with optional easing. */
export const prog = (frame: number, from: number, to: number, ease: (t: number) => number = (t) => t) =>
  ease(interpolate(frame, [from, to], [0, 1], clamp));

export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const backOut = Easing.out(Easing.back(2.2));
export const expoOut = Easing.out(Easing.exp);

/** A "slam": big -> normal with overshoot. Returns scale. */
export const slam = (frame: number, at: number, from = 2.6, dur = 7) => {
  if (frame < at) return 0;
  const t = prog(frame, at, at + dur);
  const s = lerp(from, 1, expoOut(t));
  const wobble = Math.sin(t * Math.PI * 3) * (1 - t) * 0.06;
  return s - wobble;
};

/** Decaying screen-shake offset for a list of hit frames. */
export const shake = (frame: number, hits: number[], amp = 26, decay = 9, seed = 'sh') => {
  let x = 0;
  let y = 0;
  let r = 0;
  for (const h of hits) {
    const d = frame - h;
    if (d < 0 || d > decay * 3) continue;
    const k = Math.exp(-d / decay) * amp;
    x += (random(`${seed}x${frame}${h}`) - 0.5) * 2 * k;
    y += (random(`${seed}y${frame}${h}`) - 0.5) * 2 * k;
    r += (random(`${seed}r${frame}${h}`) - 0.5) * 0.08 * k;
  }
  return {x, y, r};
};

/** Zoom punch: quick +amount then ease back. */
export const punch = (frame: number, hits: number[], amount = 0.12, len = 10) => {
  let z = 0;
  for (const h of hits) {
    const d = frame - h;
    if (d < 0 || d > len) continue;
    z += amount * Math.exp(-d / (len / 3.5));
  }
  return z;
};

/** Flash opacity right after hit frames. */
export const flash = (frame: number, hits: number[], len = 6) => {
  let o = 0;
  for (const h of hits) {
    const d = frame - h;
    if (d >= 0 && d < len) o = Math.max(o, 1 - d / len);
  }
  return o;
};
