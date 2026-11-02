import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {Caption} from '../components/Text';
import {Camera} from '../components/Camera';
import {Doll, DOLL_VIEWBOX} from '../components/Doll';
import {C} from '../theme';
import {TL, f, prog, easeInOut, slam, shake, punch, clamp} from '../lib/anim';
import {mouthAt, wordFrame, wordIndexAt} from '../lib/voice';
import {interpolate} from 'remotion';

/** 0–2s: black, heartbeat, doll head slowly turns to camera, eyes glow. "DON'T MOVE." */
export const Intro: React.FC<{frame: number}> = ({frame}) => {
  const [ta, tb] = TL.intro.headTurn.map(f);
  // slow turn with creepy mechanical stutter
  const raw = prog(frame, ta, tb, easeInOut);
  const stutter = Math.floor(raw * 9) / 9;
  const turn = raw * 0.55 + stutter * 0.45;
  const theta = 180 - turn * 180;
  const glowAt = f(TL.intro.eyesGlow);
  const glow = interpolate(frame, [glowAt, glowAt + 5, glowAt + 9], [0, 1.3, 1], clamp);
  const beats = TL.intro.heartbeats.map(f);
  const pulse = punch(frame, beats, 0.025, 8);
  const light = interpolate(frame, [0, 12], [0, 1], clamp) * (0.82 + punch(frame, beats, 0.6, 6));
  const w1 = wordFrame('dont_move', 0);
  const w2 = wordFrame('dont_move', 1);
  const wi = wordIndexAt('dont_move', frame);
  const sh = shake(frame, [w2, glowAt], 16, 5);
  const zoom = 1.55 + frame * 0.004 + pulse;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Camera zoom={zoom} fx={540} fy={600} sy={760} shakeX={sh.x} shakeY={sh.y}>
        {/* spotlight */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 34% 26% at 50% 33%, rgba(255,238,215,${0.33 * light}) 0%, rgba(120,60,140,${0.12 * light}) 55%, rgba(0,0,0,0) 100%)`,
          }}
        />
        <svg viewBox={DOLL_VIEWBOX} width={1080} height={2680} style={{position: 'absolute', left: 0, top: 120, opacity: Math.min(1, light)}}>
          <Doll theta={theta} eyeGlow={glow} mouth={mouthAt('dont_move', frame) * 0.8} tilt={turn * -7} id="intro" />
        </svg>
        {/* red glow wash once eyes ignite */}
        <AbsoluteFill style={{background: `radial-gradient(circle at 50% 38%, rgba(255,20,50,${0.35 * glow}) 0%, rgba(0,0,0,0) 40%)`}} />
      </Camera>
      {/* darkness flicker */}
      <AbsoluteFill style={{background: '#000', opacity: random(`fl${frame}`) < 0.08 && frame < glowAt ? 0.5 : 0}} />
      {wi >= 0 && (
        <Caption
          lines={wi >= 1 ? ["DON'T", 'MOVE.'] : ["DON'T"]}
          lineColors={[C.white, C.red]}
          y={wi >= 1 ? 1290 : 1230}
          size={210}
          scale={wi >= 1 ? slam(frame, w2, 1.8, 6) : slam(frame, w1, 2.2, 7)}
          glow={C.red}
          rgbSplit={Math.max(0, 14 - (frame - (wi >= 1 ? w2 : w1)) * 2)}
        />
      )}
    </AbsoluteFill>
  );
};
