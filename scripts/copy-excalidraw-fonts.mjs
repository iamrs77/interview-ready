// Copies the drawing fonts of Excalidraw (the Free canvas) into public/excalidraw/fonts, so the site serves
// them itself instead of loading them from a CDN. Runs after every `npm install` (the "postinstall" script),
// so the fonts always match the installed Excalidraw version. The copy is not committed (see .gitignore).
// The canvas points Excalidraw here with window.EXCALIDRAW_ASSET_PATH = '/excalidraw/'.
//
// Skipped: Xiaolai (13 MB), the font for Chinese, Japanese and Korean text. Only that text would need it,
// and then the browser falls back to Excalidraw's CDN (esm.sh) for those characters.
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const from = join(process.cwd(), 'node_modules', '@excalidraw', 'excalidraw', 'dist', 'prod', 'fonts');
const to = join(process.cwd(), 'public', 'excalidraw', 'fonts');
const SKIP = new Set(['Xiaolai']);

if (!existsSync(from)) {
  console.log('copy-excalidraw-fonts: Excalidraw is not installed, nothing to copy.');
  process.exit(0);
}

rmSync(to, { recursive: true, force: true });
const families = readdirSync(from).filter((name) => !SKIP.has(name));
for (const family of families) cpSync(join(from, family), join(to, family), { recursive: true });
console.log(`copy-excalidraw-fonts: copied ${families.length} font families to public/excalidraw/fonts.`);
