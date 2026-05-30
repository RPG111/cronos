import sharp from "sharp";

const bg = { r: 9, g: 8, b: 15 }; // #09080f

// Resize logo to fit within 140×140 (leaving padding), centered on 180×180 dark bg
const logo = await sharp("public/logo-cronos.png")
  .resize(140, 140, { fit: "contain", background: { ...bg, alpha: 1 } })
  .png()
  .toBuffer();

await sharp({
  create: { width: 180, height: 180, channels: 3, background: bg },
})
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toFile("src/app/apple-touch-icon.png");

console.log("Done — src/app/apple-touch-icon.png generated (180×180, solid background)");
