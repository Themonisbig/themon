/**
 * ✏️  EDIT ME — everything a viewer reads on the end card lives here.
 *
 * After changing, re-render with:  npm run render
 * (Or override at render time without editing:
 *   npx remotion render Promo out/promo.mp4 --props='{"gameName":"FREEZE","liveDay":"SATURDAY","liveTime":"9PM ET","handle":"mychannel"}')
 */
export const defaultPromoConfig = {
  /** Big title on the end card. Keep it short (≤ 14 chars looks best). */
  gameName: 'THE DOLL GAME',
  /** Day shown as "LIVE <DAY> at <TIME>". */
  liveDay: 'FRIDAY',
  liveTime: '8PM ET',
  /** Your TikTok handle WITHOUT the @. */
  handle: 'yourhandle',
};

export type PromoConfig = typeof defaultPromoConfig;
