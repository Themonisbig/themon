import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {DollStage} from '../components/DollStage';
import {ScreenFlash} from '../components/Fx';
import {C, SAFE, SAFE_CX, SAFE_W} from '../theme';
import {FONT_DISPLAY, FONT_UI} from '../fonts';
import {PromoConfig} from '../config';
import {TL, f, slam, shake, punch, prog, clamp, backOut, FPS} from '../lib/anim';

/** 26–30s: end card with game name, schedule, handle and a pulsing JOIN NOW button. */
export const End: React.FC<{frame: number; config: PromoConfig}> = ({frame, config}) => {
  const start = f(TL.end.hit);
  const local = frame - start;
  const beat = (60 / TL.bpm) * FPS;
  const beatPhase = (local % beat) / beat;
  const pulse = 1 + Math.exp(-beatPhase * 6) * 0.07;
  const sh = shake(frame, [start, f(TL.duration - 1)], 26, 7);
  const name = config.gameName.toUpperCase();
  const longest = Math.max(...name.split(' ').map((w) => w.length));
  const twoLines = name.length > 10 && name.includes(' ');
  const lines = twoLines ? splitBalanced(name) : [name];
  const titleSize = Math.min(230, Math.floor(SAFE_W / (Math.max(...lines.map((l) => l.length), longest) * 0.5)));
  const appear = (d: number) => prog(frame, start + d, start + d + 8, backOut);
  const blink = Math.sin(frame / 3) > -0.4 ? 1 : 0.35;

  return (
    <AbsoluteFill style={{background: '#050208'}}>
      {/* the doll peeking down from above */}
      <DollStage
        scale={1.6}
        focusY={-190}
        cy={interpolate(local, [0, 14], [-120, 120], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)})}
        shakeX={sh.x}
        shakeY={sh.y}
        theta={0}
        tilt={-8 + Math.sin(frame / 14) * 3}
        eyeGlow={1 + Math.exp(-beatPhase * 5) * 0.4}
        redLight={0.5}
        spot={0.5}
        id="end"
      />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,2,8,0) 18%, rgba(5,2,8,0.85) 34%, #050208 52%)'}} />
      {/* neon frame */}
      <AbsoluteFill style={{left: 30, top: 470, right: 150, bottom: 380, border: `4px solid ${C.green}`, borderRadius: 40, boxShadow: `0 0 30px ${C.green}, inset 0 0 30px ${C.green}55`, opacity: 0.55 * appear(2)}} />

      <div style={{position: 'absolute', left: SAFE.left, width: SAFE_W, top: 540, textAlign: 'center', transform: `scale(${slam(frame, start, 2.4, 8)}) translate(${sh.x * 0.5}px, ${sh.y * 0.5}px)`, transformOrigin: `${SAFE_CX - SAFE.left}px 50%`}}>
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: titleSize,
              lineHeight: 0.95,
              letterSpacing: 3,
              color: lines.length > 1 && i === lines.length - 1 ? C.green : '#fff',
              WebkitTextStroke: `${Math.round(titleSize * 0.05)}px #1a0004`,
              paintOrder: 'stroke fill',
              textShadow: `0 0 ${titleSize * 0.3}px ${C.red}, 0 ${titleSize * 0.06}px 0 #1a0004`,
            }}
          >
            {l}
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          left: SAFE.left,
          width: SAFE_W,
          top: 940,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 22,
          transform: `scale(${appear(6)})`,
          fontFamily: FONT_DISPLAY,
          fontSize: 84,
          color: '#fff',
          letterSpacing: 2,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{background: C.red, borderRadius: 16, padding: '0 22px', boxShadow: `0 0 30px ${C.red}`, display: 'flex', alignItems: 'center', gap: 14}}>
          <span style={{width: 22, height: 22, borderRadius: 11, background: '#fff', opacity: blink}} />
          LIVE
        </span>
        <span>
          {config.liveDay.toUpperCase()} <span style={{color: C.green}}>@</span> {config.liveTime.toUpperCase()}
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          left: SAFE.left,
          width: SAFE_W,
          top: 1075,
          textAlign: 'center',
          fontFamily: FONT_UI,
          fontWeight: 900,
          fontSize: 52,
          lineHeight: 1.2,
          color: '#fff',
          transform: `translateY(${(1 - appear(10)) * 60}px)`,
          opacity: Math.min(1, appear(10)),
        }}
      >
        <div>
          Follow <span style={{color: C.green}}>@{config.handle}</span>
        </div>
        <div style={{color: '#d9d2e6'}}>+ tap LIVE to play</div>
      </div>

      {/* JOIN NOW */}
      <div style={{position: 'absolute', left: SAFE.left, width: SAFE_W, top: 1300, height: 170, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        {[0, 1].map((r) => {
          const rp = (beatPhase + r * 0.5) % 1;
          return (
            <div
              key={r}
              style={{
                position: 'absolute',
                width: 620,
                height: 150,
                borderRadius: 999,
                border: `5px solid ${C.green}`,
                transform: `scale(${(1 + rp * 0.35) * appear(14)})`,
                opacity: (1 - rp) * 0.7 * Math.min(1, appear(14)),
              }}
            />
          );
        })}
        <div
          style={{
            width: 620,
            height: 150,
            borderRadius: 999,
            background: `linear-gradient(180deg, #8dffa8 0%, ${C.green} 45%, ${C.greenDeep} 100%)`,
            boxShadow: `0 0 ${50 * pulse}px ${C.green}, 0 12px 0 #064d1c, inset 0 4px 0 rgba(255,255,255,0.6)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT_DISPLAY,
            fontSize: 98,
            letterSpacing: 6,
            color: '#04170a',
            transform: `scale(${pulse * appear(14)})`,
          }}
        >
          JOIN NOW
        </div>
      </div>
      <ScreenFlash color="#ffffff" opacity={interpolate(local, [0, 5], [0.7, 0], clamp)} />
      <ScreenFlash color={C.red} opacity={punch(frame, [f(TL.duration - 1)], 0.4, 8)} />
    </AbsoluteFill>
  );
};

function splitBalanced(s: string) {
  const words = s.split(' ');
  let best = [s];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const d = Math.abs(a.length - b.length);
    if (d < bestDiff) {
      bestDiff = d;
      best = [a, b];
    }
  }
  return best;
}
