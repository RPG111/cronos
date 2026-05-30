import sharp from "sharp";
import { copyFileSync } from "fs";

const SRC = "public/logo-cronos.png";
const BG_THRESHOLD = 40; // pixels with R,G,B all below this become transparent

// Step 1: remove black background
const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const pixels = new Uint8Array(data);

for (let i = 0; i < pixels.length; i += channels) {
  if (pixels[i] < BG_THRESHOLD && pixels[i+1] < BG_THRESHOLD && pixels[i+2] < BG_THRESHOLD) {
    pixels[i+3] = 0;
  }
}

const transparentBuf = await sharp(Buffer.from(pixels), { raw: { width, height, channels } })
  .png()
  .toBuffer();

// Save transparent version back to /public
await sharp(transparentBuf).toFile(SRC);
console.log(`✓ Transparent background saved to ${SRC}`);

// Step 2: icon.png — 512×512 transparent (Next.js favicon)
await sharp(transparentBuf)
  .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile("src/app/icon.png");
console.log("✓ src/app/icon.png (512×512)");

// Step 3: apple-touch-icon.png — 180×180 transparent
await sharp(transparentBuf)
  .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile("src/app/apple-touch-icon.png");
console.log("✓ src/app/apple-touch-icon.png (180×180)");
