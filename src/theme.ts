export const W = 1080;
export const H = 1920;

export const C = {
  green: '#39ff6a',
  greenDeep: '#0b8f34',
  red: '#ff1f3d',
  redDeep: '#8a0014',
  gold: '#ffc83a',
  goldDeep: '#b8740a',
  ink: '#05040a',
  night: '#0b0814',
  white: '#ffffff',
  bone: '#f3ead9',
};

/**
 * Text-safe zone. TikTok's caption/UI covers the bottom ~20% and the action rail
 * covers the right edge, so ALL text lives inside this box.
 */
export const SAFE = {
  left: 64,
  right: W - 176, // 904
  top: 150,
  bottom: Math.round(H * 0.8) - 16, // 1520
};
export const SAFE_CX = (SAFE.left + SAFE.right) / 2; // 484
export const SAFE_W = SAFE.right - SAFE.left; // 840
