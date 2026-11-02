import React from 'react';
import {AbsoluteFill} from 'remotion';

/** Wraps a 1080x1920 stage; zooms around a focus point and applies shake. */
export const Camera: React.FC<{
  zoom?: number;
  fx?: number; // focus point in stage px that ends up at screen centre (or at `sx/sy`)
  fy?: number;
  sx?: number;
  sy?: number;
  shakeX?: number;
  shakeY?: number;
  rot?: number;
  children: React.ReactNode;
}> = ({zoom = 1, fx = 540, fy = 960, sx = 540, sy = 960, shakeX = 0, shakeY = 0, rot = 0, children}) => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <AbsoluteFill
      style={{
        transformOrigin: '0 0',
        transform: `translate(${sx + shakeX}px, ${sy + shakeY}px) rotate(${rot}deg) scale(${zoom}) translate(${-fx}px, ${-fy}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
);
