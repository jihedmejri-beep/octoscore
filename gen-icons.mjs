import sharp from 'sharp';
import { mkdirSync } from 'fs';

const src = 'src/assets/logo.jpeg';
const out = 'public';
mkdirSync(out, { recursive: true });

const white = { r: 255, g: 255, b: 255, alpha: 1 };

async function run() {
  // Standard "any" icons — full-bleed crest on white.
  await sharp(src).resize(192, 192, { fit: 'contain', background: white })
    .png().toFile(`${out}/pwa-192x192.png`);
  await sharp(src).resize(512, 512, { fit: 'contain', background: white })
    .png().toFile(`${out}/pwa-512x512.png`);

  // Apple touch icon — 180x180, white bg (iOS ignores transparency anyway).
  await sharp(src).resize(180, 180, { fit: 'contain', background: white })
    .flatten({ background: white }).png().toFile(`${out}/apple-touch-icon.png`);

  // Maskable 512 — shrink crest to ~80% so it survives the circle/squircle crop.
  const inner = Math.round(512 * 0.8);
  const logo = await sharp(src).resize(inner, inner, { fit: 'contain', background: white }).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: white } })
    .composite([{ input: logo, gravity: 'center' }])
    .png().toFile(`${out}/maskable-512x512.png`);

  console.log('Icons generated.');
}
run().catch((e) => { console.error(e); process.exit(1); });
