import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {FONT_DISPLAY} from '../fonts';

/** Cartoon smoke puff (non-graphic elimination). t: 0..1 */
export const Puff: React.FC<{x: number; y: number; t: number; scale?: number; seed?: string}> = ({x, y, t, scale = 1, seed = 'p'}) => {
  if (t <= 0 || t >= 1) return null;
  const grow = 1 - Math.pow(1 - t, 3);
  const fade = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={fade}>
      {Array.from({length: 9}, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + random(`${seed}a${i}`);
        const d = 40 + 70 * grow * (0.7 + random(`${seed}d${i}`) * 0.6);
        const r = (34 + random(`${seed}r${i}`) * 24) * (0.4 + grow * 0.8);
        return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d * 0.75 - 80} r={r} fill={i % 3 ? '#d9d4df' : '#b8b2c2'} />;
      })}
      <circle cx={0} cy={-80} r={60 * (0.5 + grow * 0.6)} fill="#ece8f0" />
      {Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const d = 90 + 120 * grow;
        return <circle key={`s${i}`} cx={Math.cos(a) * d} cy={Math.sin(a) * d * 0.8 - 80} r={8 * (1 - t)} fill="#fff" />;
      })}
    </g>
  );
};

/** Expanding ring burst. t: 0..1 */
export const Burst: React.FC<{x: number; y: number; t: number; color: string; r?: number; width?: number}> = ({x, y, t, color, r = 120, width = 14}) => {
  if (t <= 0 || t >= 1) return null;
  const e = 1 - Math.pow(1 - t, 3);
  return (
    <g>
      <circle cx={x} cy={y} r={r * e} fill="none" stroke={color} strokeWidth={width * (1 - t)} opacity={1 - t} />
      {Array.from({length: 10}, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * r * 0.4 * e}
            y1={y + Math.sin(a) * r * 0.4 * e}
            x2={x + Math.cos(a) * r * 1.1 * e}
            y2={y + Math.sin(a) * r * 1.1 * e}
            stroke={color}
            strokeWidth={width * 0.6 * (1 - t)}
            strokeLinecap="round"
            opacity={1 - t}
          />
        );
      })}
    </g>
  );
};

/** Confetti burst from origin(s). t in frames since burst. */
export const Confetti: React.FC<{frameSince: number; origins: {x: number; y: number}[]; count?: number}> = ({frameSince, origins, count = 90}) => {
  if (frameSince < 0) return null;
  const colors = ['#ffc83a', '#39ff6a', '#ff1f3d', '#ffffff', '#22e0ff', '#ff3fb4'];
  const t = frameSince / 30;
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {origins.flatMap((o, oi) =>
        Array.from({length: count}, (_, i) => {
          const k = `${oi}-${i}`;
          const ang = -Math.PI / 2 + (random(`ca${k}`) - 0.5) * 2.4;
          const v = 900 + random(`cv${k}`) * 1500;
          const drag = 1 - Math.exp(-t * 2.2);
          const x = o.x + Math.cos(ang) * v * drag / 2.2 + Math.sin(t * 4 + i) * 30 * t;
          const y = o.y + Math.sin(ang) * v * drag / 2.2 + 520 * t * t;
          const rot = random(`cr${k}`) * 360 + frameSince * (8 + random(`cs${k}`) * 14);
          const w = 14 + random(`cw${k}`) * 16;
          const flip = Math.abs(Math.cos((frameSince + i) * 0.25));
          return (
            <rect
              key={k}
              x={-w / 2}
              y={-w / 4}
              width={w}
              height={w / 2}
              fill={colors[i % colors.length]}
              transform={`translate(${x}, ${y}) rotate(${rot}) scale(1, ${0.3 + flip * 0.7})`}
              opacity={Math.max(0, 1 - Math.max(0, t - 2.2))}
            />
          );
        }),
      )}
    </svg>
  );
};

/** Full-screen colour flash. */
export const ScreenFlash: React.FC<{color: string; opacity: number}> = ({color, opacity}) =>
  opacity > 0.001 ? <AbsoluteFill style={{background: color, opacity, mixBlendMode: 'screen'}} /> : null;

/** Film grain + vignette + subtle scanlines — the "premium" finishing layer. */
export const Finish: React.FC<{frame: number; vignette?: number}> = ({frame, vignette = 1}) => (
  <>
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.9) 100%)',
        opacity: vignette,
      }}
    />
    <AbsoluteFill
      style={{
        opacity: 0.09,
        mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${frame % 12}'/></filter><rect width='240' height='240' filter='url(#n)'/></svg>`,
        )}")`,
        backgroundPosition: `${(frame * 37) % 240}px ${(frame * 53) % 240}px`,
      }}
    />
    <AbsoluteFill
      style={{
        opacity: 0.06,
        backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 2px, transparent 2px, transparent 5px)',
      }}
    />
  </>
);

/** Stamp text ("ELIMINATED") */
export const Stamp: React.FC<{text: string; x: number; y: number; t: number; color?: string; size?: number; rot?: number}> = ({
  text,
  x,
  y,
  t,
  color = '#ff1f3d',
  size = 120,
  rot = -8,
}) => {
  if (t <= 0) return null;
  const s = t < 1 ? 2.4 - 1.4 * (1 - Math.pow(1 - t, 4)) : 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        fontFamily: FONT_DISPLAY,
        fontSize: size,
        color,
        padding: `${size * 0.05}px ${size * 0.22}px`,
        border: `${size * 0.07}px solid ${color}`,
        borderRadius: size * 0.12,
        background: 'rgba(10,0,4,0.82)',
        letterSpacing: 4,
        textShadow: `0 0 ${size * 0.3}px ${color}`,
        boxShadow: `0 0 ${size * 0.4}px ${color}88, inset 0 0 ${size * 0.25}px ${color}55`,
        whiteSpace: 'nowrap',
        opacity: Math.min(1, t * 3),
      }}
    >
      {text}
    </div>
  );
};

/** Radial speed streaks for sprint energy. */
export const SpeedLines: React.FC<{frame: number; color?: string; opacity?: number; cx?: number; cy?: number}> = ({
  frame,
  color = '#ffffff',
  opacity = 0.5,
  cx = 540,
  cy = 820,
}) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity}}>
    {Array.from({length: 34}, (_, i) => {
      const a = (i / 34) * Math.PI * 2 + random(`sl${i}`) * 0.2;
      const ph = (frame * (0.09 + random(`sv${i}`) * 0.05) + random(`so${i}`)) % 1;
      const r0 = 520 + ph * 900;
      const r1 = r0 + 160 + random(`sL${i}`) * 260;
      return (
        <line
          key={i}
          x1={cx + Math.cos(a) * r0}
          y1={cy + Math.sin(a) * r0}
          x2={cx + Math.cos(a) * r1}
          y2={cy + Math.sin(a) * r1}
          stroke={color}
          strokeWidth={3 + random(`sw${i}`) * 5}
          strokeLinecap="round"
          opacity={0.25 + ph * 0.6}
        />
      );
    })}
  </svg>
);
