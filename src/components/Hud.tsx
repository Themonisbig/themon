import React from 'react';
import {FONT_DISPLAY, FONT_UI} from '../fonts';
import {C, SAFE, SAFE_W} from '../theme';
import {GiftIcon, GiftKind} from './Gifts';

const pill: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  fontFamily: FONT_UI,
  fontWeight: 900,
  color: '#fff',
  borderRadius: 999,
  whiteSpace: 'nowrap',
};

/** Generic "LIVE" badge + viewer count (game HUD, no platform branding). */
export const LiveBadge: React.FC<{frame: number; viewers?: string; opacity?: number}> = ({frame, viewers = '12.8K', opacity = 1}) => (
  <div style={{...pill, left: SAFE.left, top: SAFE.top, opacity, gap: 12}}>
    <div style={{background: C.red, padding: '8px 20px', borderRadius: 12, fontSize: 34, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10}}>
      <div style={{width: 14, height: 14, borderRadius: 7, background: '#fff', opacity: Math.sin(frame / 4) > -0.3 ? 1 : 0.2}} />
      LIVE
    </div>
    <div style={{background: 'rgba(0,0,0,0.55)', padding: '8px 18px', borderRadius: 12, fontSize: 30, display: 'flex', alignItems: 'center', gap: 10}}>
      <svg width={36} height={24} viewBox="0 0 36 24">
        <path d="M 2 12 Q 18 -6 34 12 Q 18 30 2 12 Z" fill="none" stroke="#fff" strokeWidth={3} />
        <circle cx={18} cy={12} r={5} fill="#fff" />
      </svg>
      {viewers}
    </div>
  </div>
);

export const LightPill: React.FC<{state: 'green' | 'red'; scale?: number; y?: number}> = ({state, scale = 1, y = SAFE.top + 78}) => {
  const col = state === 'green' ? C.green : C.red;
  return (
    <div
      style={{
        ...pill,
        left: SAFE.left,
        top: y,
        transform: `scale(${scale})`,
        transformOrigin: 'left center',
        background: 'rgba(0,0,0,0.6)',
        border: `3px solid ${col}`,
        padding: '6px 22px 6px 14px',
        fontSize: 30,
        boxShadow: `0 0 24px ${col}88`,
      }}
    >
      <div style={{width: 22, height: 22, borderRadius: 11, background: col, boxShadow: `0 0 18px ${col}`}} />
      {state === 'green' ? 'GREEN LIGHT' : 'RED LIGHT'}
    </div>
  );
};

/** Top comment bubble (the viewer's question to the doll). */
export const CommentBubble: React.FC<{user: string; text: string; t: number; y?: number}> = ({user, text, t, y = SAFE.top + 40}) => {
  if (t <= 0) return null;
  const s = t < 1 ? 0.4 + 0.6 * easeBack(t) : 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE.left,
        top: y,
        width: SAFE_W,
        transform: `scale(${s})`,
        transformOrigin: '12% 0%',
        opacity: Math.min(1, t * 2.5),
      }}
    >
      <div
        style={{
          ...pill,
          position: 'relative',
          left: 0,
          display: 'inline-flex',
          background: C.green,
          color: '#06120a',
          fontSize: 26,
          padding: '6px 18px',
          marginBottom: 12,
          borderRadius: 10,
          gap: 8,
        }}
      >
        <svg width={34} height={26} viewBox="-55 -45 110 90">
          <path d="M -48 26 L -52 -22 L -26 2 L 0 -38 L 26 2 L 52 -22 L 48 26 Z" fill="#06120a" />
        </svg>
        TOP COMMENT
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          background: 'rgba(12,8,20,0.88)',
          border: `4px solid ${C.green}`,
          borderRadius: 34,
          padding: '22px 28px',
          boxShadow: `0 0 50px ${C.green}66, 0 20px 40px rgba(0,0,0,0.6)`,
        }}
      >
        <div
          style={{
            width: 92,
            height: 92,
            flex: '0 0 92px',
            borderRadius: 46,
            background: 'linear-gradient(135deg, #ff3fb4, #8c5bff)',
            border: '4px solid #fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT_UI,
            fontWeight: 900,
            fontSize: 44,
            color: '#fff',
          }}
        >
          {user.replace('@', '').charAt(0).toUpperCase()}
        </div>
        <div style={{fontFamily: FONT_UI, fontWeight: 900, color: '#fff', lineHeight: 1.12}}>
          <div style={{fontSize: 34, color: C.green}}>{user}</div>
          <div style={{fontSize: 46}}>{text}</div>
        </div>
      </div>
    </div>
  );
};

const easeBack = (t: number) => {
  const c1 = 2.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Gift legend row: rose = 1 step, star = 5, crown = 20. */
export const GiftLegend: React.FC<{t: number; y?: number}> = ({t, y = SAFE.top + 170}) => {
  const items: [GiftKind, string][] = [
    ['rose', '+1 STEP'],
    ['star', '+5 STEPS'],
    ['crown', '+20 STEPS'],
  ];
  return (
    <div style={{position: 'absolute', left: SAFE.left, top: y, width: SAFE_W, display: 'flex', justifyContent: 'space-between'}}>
      {items.map(([k, label], i) => {
        const tt = Math.max(0, Math.min(1, t * 3 - i * 0.6));
        return (
          <div
            key={k}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(8,6,14,0.8)',
              border: '3px solid rgba(255,255,255,0.18)',
              borderRadius: 999,
              padding: '6px 18px 6px 8px',
              transform: `translateY(${(1 - easeBack(tt)) * -80}px)`,
              opacity: tt,
            }}
          >
            <svg width={64} height={64} viewBox="-60 -60 120 120">
              <GiftIcon kind={k} size={100} glow={0.6} />
            </svg>
            <span style={{fontFamily: FONT_UI, fontWeight: 900, fontSize: 28, color: '#fff'}}>{label}</span>
          </div>
        );
      })}
    </div>
  );
};

export type LeaderRow = {name: string; num: number; color: string; progress: number};

export const Leaderboard: React.FC<{rows: LeaderRow[]; t: number; frame: number; y?: number}> = ({rows, t, frame, y = 860}) => (
  <div style={{position: 'absolute', left: SAFE.left, top: y, width: SAFE_W - 40}}>
    <div
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 64,
        color: C.gold,
        letterSpacing: 2,
        textShadow: `0 0 24px ${C.gold}99, 0 4px 0 #000`,
        transform: `translateX(${(1 - Math.min(1, t * 2)) * -900}px)`,
        marginBottom: 10,
      }}
    >
      LIVE LEADERBOARD
    </div>
    {rows.map((r, i) => {
      const tt = Math.max(0, Math.min(1, t * 2.4 - (i + 1) * 0.28));
      const x = (1 - easeBack(tt)) * -1000;
      const prog = r.progress * Math.min(1, Math.max(0, t * 1.4 - 0.2)) + Math.sin(frame / 5 + i) * 0.006;
      return (
        <div
          key={r.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            height: 96,
            marginBottom: 12,
            padding: '0 22px',
            borderRadius: 22,
            background: i === 0 ? 'linear-gradient(90deg, rgba(255,200,58,0.35), rgba(20,12,30,0.9))' : 'rgba(16,10,26,0.88)',
            border: `3px solid ${i === 0 ? C.gold : 'rgba(255,255,255,0.14)'}`,
            transform: `translateX(${x}px)`,
            fontFamily: FONT_UI,
            fontWeight: 900,
            color: '#fff',
          }}
        >
          <div style={{width: 54, fontSize: 44, color: i === 0 ? C.gold : '#aaa', fontFamily: FONT_DISPLAY}}>{i + 1}</div>
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 33,
              background: r.color,
              border: '3px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: '#111',
            }}
          >
            {r.num}
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 32, marginBottom: 8}}>{r.name}</div>
            <div style={{height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.12)', overflow: 'hidden'}}>
              <div
                style={{
                  width: `${Math.max(0, Math.min(1, prog)) * 100}%`,
                  height: '100%',
                  borderRadius: 7,
                  background: i === 0 ? `linear-gradient(90deg, ${C.goldDeep}, ${C.gold})` : `linear-gradient(90deg, ${C.greenDeep}, ${C.green})`,
                  boxShadow: `0 0 14px ${i === 0 ? C.gold : C.green}`,
                }}
              />
            </div>
          </div>
          <div style={{fontSize: 30, color: i === 0 ? C.gold : C.green, width: 92, textAlign: 'right'}}>{Math.round(prog * 100)}m</div>
        </div>
      );
    })}
  </div>
);
