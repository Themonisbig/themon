// Usage: node scripts/stills.mjs outDir 30 60 90 ...   (renders preview PNGs of given frames)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const shell = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable = fs.existsSync(shell) ? shell : null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'Promo', browserExecutable});
for (const fr of frames.map(Number)) {
  await renderStill({composition, serveUrl, frame: fr, output: path.join(outDir, `f${String(fr).padStart(3, '0')}.png`), browserExecutable, scale: 0.5});
  process.stdout.write(`${fr} `);
}
console.log('done');
