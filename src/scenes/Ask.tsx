import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ArenaShot} from '../components/ArenaShot';
import {DollStage} from '../components/DollStage';
import {Caption} from '../components/Text';
import {CommentBubble, LiveBadge} from '../components/Hud';
import {ScreenFlash} from '../components/Fx';
import {C} from '../theme';
import {FONT_CREEPY} from '../fonts';
import {TL, f, slam, shake, punch, prog, clamp, lerp, easeOut} from '../lib/anim';
import {mouthAt, wordFrame, wordIndexAt} from '../lib/voice';

/** 11–17s: top comment pops up, camera pushes in on the doll, she answers in a deep voice. */
export const Ask: React.FC<{frame: number}> = ({frame}) => {
  const start = f(TL.scenes.ask[0]);
  const end = f(TL.scenes.ask[1]);
  const commentAt = f(TL.ask.comment);
  const capAt = commentAt + 14;
  const w0 = wordFrame('only_if', 0);
  const w1 = wordFrame('only_if', 1);
  const wi = wordIndexAt('only_if', frame);
  const mouth = mouthAt('only_if', frame);
  // four cuts, each a little closer
  const cuts = [start, w0 - 2, w1 - 2, w1 + 26];
  const shot = cuts.filter((c) => frame >= c).length - 1;
  const local = frame - cuts[shot];
  const sh = shake(frame, [commentAt, w0, w1], 12, 6);
  const voiceShake = mouth * 6;
  const glow = 0.85 + mouth * 0.6 + Math.sin(frame / 3) * 0.05;
  const tilt = Math.sin((frame - start) / 30) * 4 - (frame - start) * 0.03;
  const pz = punch(frame, cuts.slice(1), 0.06, 8);
  const flashCut = cuts.slice(1).some((c) => frame - c >= 0 && frame - c < 2);

  let scene: React.ReactNode;
  if (shot === 0) {
    const k = prog(frame, start, cuts[1]);
    scene = (
      <ArenaShot
        frame={frame}
        simFrame={f(TL.scenes.red[1]) - 1}
        cam={{zoom: lerp(1.05, 1.5, easeOut(k)) + pz, fx: 540, fy: lerp(760, 520, k), sy: 900}}
        shake={sh}
        red={0.18}
        spot={0.9}
        doll={{theta: 0, eyeGlow: glow, mouth, redLight: 0.4}}
        look={(id) => (id === 4 ? {hidden: true} : undefined)}
      />
    );
  } else {
    const cfg = [
      null,
      {s: 1.5, s2: 1.7, fy: -130, cy: 760},
      {s: 2.3, s2: 2.6, fy: -160, cy: 640},
      {s: 3.4, s2: 3.9, fy: -150, cy: 640},
    ][shot]!;
    const dur = (cuts[shot + 1] ?? end) - cuts[shot];
    const s = lerp(cfg.s, cfg.s2, Math.min(1, local / dur)) * (1 + pz);
    scene = (
      <DollStage
        scale={s}
        focusY={cfg.fy}
        cy={cfg.cy}
        shakeX={sh.x + Math.sin(frame * 1.7) * voiceShake}
        shakeY={sh.y}
        theta={Math.sin(frame / 9) * 3}
        eyeGlow={glow}
        mouth={mouth}
        tilt={tilt}
        redLight={0.35 + mouth * 0.4}
        id="ask"
      />
    );
  }

  return (
    <AbsoluteFill style={{background: '#050208'}}>
      {scene}
      <AbsoluteFill
        style={{background: `radial-gradient(circle at 50% 40%, rgba(255,20,50,${0.12 + mouth * 0.22}) 0%, rgba(0,0,0,0) 55%)`}}
      />
      {/* legibility band behind subtitles */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(5,0,3,0.88) 56%, rgba(5,0,3,0.92) 80%, rgba(0,0,0,0.4) 100%)', opacity: shot === 0 ? 0.6 : 1}} />
      <ScreenFlash color="#ffffff" opacity={flashCut ? 0.25 : 0} />
      <LiveBadge frame={frame} opacity={frame < commentAt ? 1 : 0} />
      <CommentBubble user="@viewer" text="will I survive tonight?" t={prog(frame, commentAt, commentAt + 8)} y={150} />
      {frame >= capAt && (
        <Caption
          lines={['ASK THE DOLL', 'ANYTHING']}
          lineColors={[C.white, C.green]}
          y={1395}
          size={124}
          glow={C.green}
          scale={slam(frame, capAt, 2, 6) * (1 + punch(frame, [w0, w1], 0.04, 6))}
        />
      )}
      {wi >= 0 && (
        <Caption
          lines={wi >= 1 ? ['ONLY...', 'IF YOU SEND', 'ENOUGH.'] : ['ONLY...']}
          y={wi >= 1 ? 1085 : 1140}
          size={wi >= 1 ? 112 : 130}
          font={FONT_CREEPY}
          color="#ff3b52"
          stroke="#000"
          glow="#ff0022"
          tracking={3}
          lineHeight={1.0}
          scale={slam(frame, wi >= 1 ? w1 : w0, 1.5, 6)}
          opacity={interpolate(frame, [end - 6, end], [1, 0], clamp)}
        />
      )}
    </AbsoluteFill>
  );
};
