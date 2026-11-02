import React from 'react';
import {FONT_DISPLAY} from '../fonts';
import {C, SAFE, SAFE_CX, SAFE_W} from '../theme';

type CaptionProps = {
  lines: string[];
  /** vertical centre of the caption block (stage px) */
  y: number;
  size?: number;
  color?: string;
  glow?: string;
  stroke?: string;
  scale?: number;
  opacity?: number;
  rotate?: number;
  font?: string;
  tracking?: number;
  /** per-line highlight colours */
  lineColors?: (string | undefined)[];
  rgbSplit?: number;
  lineHeight?: number;
};

/**
 * Huge readable caption. Always centred inside the TikTok text-safe box
 * (never in the bottom 20% or under the right-hand action rail).
 */
export const Caption: React.FC<CaptionProps> = ({
  lines,
  y,
  size = 150,
  color = C.white,
  glow = 'rgba(0,0,0,0)',
  stroke = '#000',
  scale = 1,
  opacity = 1,
  rotate = 0,
  font = FONT_DISPLAY,
  tracking = 1,
  lineColors = [],
  rgbSplit = 0,
  lineHeight = 0.98,
}) => {
  const clampedY = Math.min(Math.max(y, SAFE.top + size), SAFE.bottom - (lines.length * size * lineHeight) / 2);
  const base: React.CSSProperties = {
    position: 'absolute',
    left: SAFE.left,
    width: SAFE_W,
    top: clampedY,
    transform: `translateY(-50%) rotate(${rotate}deg) scale(${scale})`,
    transformOrigin: `${SAFE_CX - SAFE.left}px 50%`,
    textAlign: 'center',
    fontFamily: font,
    fontSize: size,
    lineHeight,
    letterSpacing: tracking,
    textTransform: 'uppercase',
    opacity,
    whiteSpace: 'pre',
  };
  const body = (dx: number, tint?: string, blend?: boolean) => (
    <div
      style={{
        ...base,
        marginLeft: dx,
        color: tint ?? color,
        mixBlendMode: blend ? 'screen' : undefined,
        opacity: blend ? opacity * 0.85 : opacity,
        WebkitTextStroke: blend ? undefined : `${Math.round(size * 0.055)}px ${stroke}`,
        paintOrder: 'stroke fill',
        textShadow: blend ? undefined : `0 0 ${size * 0.25}px ${glow}, 0 ${size * 0.06}px 0 ${stroke}`,
      }}
    >
      {lines.map((l, i) => (
        <div key={i} style={{color: tint ?? lineColors[i] ?? color}}>
          {l}
        </div>
      ))}
    </div>
  );
  return (
    <>
      {rgbSplit > 0 && body(-rgbSplit, '#ff0040', true)}
      {rgbSplit > 0 && body(rgbSplit, '#00e5ff', true)}
      {body(0)}
    </>
  );
};
