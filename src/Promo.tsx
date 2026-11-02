import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {Finish} from './components/Fx';
import {f, TL} from './lib/anim';
import {PromoConfig} from './config';
import {Intro} from './scenes/Intro';
import {Green} from './scenes/Green';
import {Gifts} from './scenes/Gifts';
import {Red} from './scenes/Red';
import {Ask} from './scenes/Ask';
import {Montage} from './scenes/Montage';
import {Winner} from './scenes/Winner';
import {End} from './scenes/End';

const SCENES: [keyof typeof TL.scenes, React.FC<{frame: number; config: PromoConfig}>][] = [
  ['intro', Intro],
  ['green', Green],
  ['gifts', Gifts],
  ['red', Red],
  ['ask', Ask],
  ['montage', Montage],
  ['winner', Winner],
  ['end', End],
];

export const Promo: React.FC<PromoConfig> = (config) => {
  const frame = useCurrentFrame();
  const entry = SCENES.find(([k]) => frame >= f(TL.scenes[k][0]) && frame < f(TL.scenes[k][1]));
  const Scene = entry?.[1];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {Scene && <Scene frame={frame} config={config} />}
      <Finish frame={frame} />
      <Audio src={staticFile('audio/soundtrack.wav')} />
    </AbsoluteFill>
  );
};
