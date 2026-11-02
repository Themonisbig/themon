import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const FONT_DISPLAY = 'Anton';
export const FONT_UI = 'Montserrat';
export const FONT_CREEPY = 'Creepster';

const fonts = [
  {family: FONT_DISPLAY, url: staticFile('fonts/anton-latin-400-normal.woff2'), weight: '400'},
  {family: FONT_UI, url: staticFile('fonts/montserrat-latin-900-normal.woff2'), weight: '900'},
  {family: FONT_CREEPY, url: staticFile('fonts/creepster-latin-400-normal.woff2'), weight: '400'},
];

// loadFont() blocks rendering (delayRender) until each font is ready.
export const fontsLoaded = Promise.all(fonts.map((f) => loadFont(f)));
