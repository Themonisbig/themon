import React from 'react';
import {Composition} from 'remotion';
import {Promo} from './Promo';
import {defaultPromoConfig} from './config';
import {TL} from './lib/anim';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Promo"
    component={Promo}
    durationInFrames={TL.fps * TL.duration}
    fps={TL.fps}
    width={1080}
    height={1920}
    defaultProps={defaultPromoConfig}
  />
);
