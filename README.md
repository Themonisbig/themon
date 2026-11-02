# THE DOLL GAME — 30s TikTok LIVE promo

A 30-second vertical promo (1080×1920, 30 fps, H.264 MP4) for a live "red light, green light" survival game, built with **Remotion** (React + TypeScript). Everything is made in code:

- **Visuals:** all SVG/CSS. That covers the original porcelain doll, the arena, 50 numbered players, gift icons, puffs, confetti and the HUD.
- **Sound:** all sound effects and the 120 BPM beat are synthesized in Python (numpy/scipy). The beat stops dead on every RED LIGHT.
- **Doll voice:** local TTS (Piper, falling back to `say` or `espeak-ng`), then pitched down, given a sub-octave layer and reverb with ffmpeg. The doll's mouth is lip-synced to the real audio envelope.

Final render: **`out/promo.mp4`**

## Change the game name, date and handle

Edit **`src/config.ts`**:

```ts
export const defaultPromoConfig = {
  gameName: 'THE DOLL GAME', // end-card title (≤ 14 chars looks best; long names auto-split onto 2 lines)
  liveDay: 'FRIDAY',         // shown as "LIVE FRIDAY @ 8PM ET"
  liveTime: '8PM ET',
  handle: 'yourhandle',      // without the @
};
```

Then re-render:

```bash
npm run render
```

Or skip editing the file and pass the values at render time:

```bash
npx remotion render Promo out/promo.mp4 --codec=h264 --crf=16 \
  --props='{"gameName":"FREEZE","liveDay":"SATURDAY","liveTime":"9PM ET","handle":"mychannel"}'
```

To preview and scrub interactively, run `npm run studio`. You can edit the props live in the right-hand panel.

## Setup from scratch

Requirements: Node 18+, Python 3.9+, ffmpeg (with the `rubberband` filter, which is standard in most builds).

```bash
npm install
pip install numpy scipy piper-tts   # piper is auto-installed by the audio script if missing
# macOS: brew install ffmpeg      Ubuntu: sudo apt install ffmpeg
npm run build                       # = npm run audio && npm run render
```

`npm run audio` downloads the Piper voice model (~120 MB, into `.voice/`, which is git-ignored) the first time. It writes:

- `public/audio/soundtrack.wav`: the full mastered mix
- `public/audio/voice_*.wav`: the processed doll lines
- `src/generated/voice.json`: word timings and mouth envelope for lip-sync

## Timing / editing

- `src/timeline.json` is the single source of truth for every timing. The video and the audio script both read it. After changing it, run `npm run build`.
- Change the doll's lines in `timeline.json` → `voice`, then run `npm run audio`. Captions and lip-sync follow automatically.
- Scenes live in `src/scenes/` (Intro, Green, Gifts, Red, Ask, Montage, Winner, End).
- Text-safe zone: `src/theme.ts` → `SAFE`. Captions never go into the bottom 20% or under the right-hand action rail.
