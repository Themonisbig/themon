import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Doll, DollProps} from './Doll';

/**
 * Renders the doll at any zoom via the SVG viewBox (stays razor sharp, no raster blow-up).
 * Doll-space point (0, focusY) lands on screen point (cx, cy) at `scale` px per unit.
 */
export const DollStage: React.FC<
  DollProps & {scale: number; focusY: number; cx?: number; cy?: number; shakeX?: number; shakeY?: number; spot?: number; spotColor?: string}
> = ({scale, focusY, cx = 540, cy = 960, shakeX = 0, shakeY = 0, spot = 1, spotColor = '255,238,215', ...doll}) => {
  const w = 1080 / scale;
  const h = 1920 / scale;
  const x = -(cx + shakeX) / scale;
  const y = focusY - (cy + shakeY) / scale;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 30%, rgba(${spotColor},${0.22 * spot}) 0%, rgba(90,40,120,${0.12 * spot}) 50%, rgba(0,0,0,0) 100%)`,
        }}
      />
      <svg viewBox={`${x} ${y} ${w} ${h}`} width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Doll {...doll} />
      </svg>
    </AbsoluteFill>
  );
};
