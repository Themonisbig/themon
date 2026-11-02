import voice from '../generated/voice.json';
import {FPS} from './anim';

type Line = (typeof voice.lines)[number];

export const voiceLine = (id: string): Line => {
  const l = voice.lines.find((x) => x.id === id);
  if (!l) throw new Error(`voice line ${id} missing - run npm run audio`);
  return l;
};

/** Mouth openness 0..1 at an absolute frame, from the real audio envelope. */
export const mouthAt = (id: string, frame: number) => {
  const l = voiceLine(id);
  const i = frame - Math.round(l.start * FPS);
  if (i < 0 || i >= l.mouth.length) return 0;
  const a = l.mouth[i] ?? 0;
  const b = l.mouth[i + 1] ?? a;
  return (a + b) / 2;
};

/** Index of the last word that has started by this frame (-1 if none). */
export const wordIndexAt = (id: string, frame: number) => {
  const l = voiceLine(id);
  let idx = -1;
  l.words.forEach((w, i) => {
    if (frame >= Math.round(w.start * FPS) - 1) idx = i;
  });
  return idx;
};

export const wordFrame = (id: string, i: number) => Math.round(voiceLine(id).words[i].start * FPS);
