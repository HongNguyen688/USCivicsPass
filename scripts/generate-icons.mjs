/**
 * Converts resources/icon.svg → resources/icon.png (1024×1024)
 * and resources/splash.png (2732×2732), then runs @capacitor/assets
 * to generate all iOS and Android icon sizes.
 *
 * Run: node scripts/generate-icons.mjs
 * Requires: npm install -D sharp   (already added as dev dep)
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');

const svgBuf = readFileSync(resolve(root, 'resources', 'icon.svg'));

console.log('Generating resources/icon.png (1024×1024)…');
await sharp(svgBuf)
  .resize(1024, 1024)
  .png()
  .toFile(resolve(root, 'resources', 'icon.png'));

// Splash: centered icon on a navy background
console.log('Generating resources/splash.png (2732×2732)…');
const iconForSplash = await sharp(svgBuf).resize(512, 512).png().toBuffer();
await sharp({
  create: { width: 2732, height: 2732, channels: 4, background: '#3C3B6E' },
})
  .composite([{ input: iconForSplash, gravity: 'center' }])
  .png()
  .toFile(resolve(root, 'resources', 'splash.png'));

console.log('Running @capacitor/assets generate…');
execSync('npx capacitor-assets generate', { cwd: root, stdio: 'inherit' });

console.log('Done! App icons generated for iOS and Android.');
