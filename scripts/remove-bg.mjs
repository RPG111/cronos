import sharp from "sharp";
import { copyFileSync } from "fs";

const src = "public/logo-cronos.png";
const dest = "src/app/icon.png";

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const pixels = new Uint8Array(data);

// Threshold: treat pixels close to black as transparent
const THRESHOLD = 40;

for (let i = 0; i < pixels.length; i += channels) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];
  if (r < THRESHOLD && g < THRESHOLD && b < THRESHOLD) {
    pixels[i + 3] = 0; // set alpha to 0 (transparent)
  }
}

await sharp(Buffer.from(pixels), { raw: { width, height, channels } })
  .png()
  .toFile(src);

copyFileSync(src, dest);

console.log(`Done — black background removed from ${src}, copied to ${dest}`);
