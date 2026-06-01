// Generates PWA icons from the project LOGO.jpg into public/.
// Run with: npm run icons
import sharp from "sharp";
import { mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "LOGO.jpg");
const outDir = join(root, "public", "icons");
const bg = { r: 11, g: 10, b: 18, alpha: 1 }; // matches --bg

await mkdir(outDir, { recursive: true });

// Standard square icons.
for (const size of [192, 512]) {
  await sharp(src)
    .resize(size, size, { fit: "cover" })
    .png()
    .toFile(join(outDir, `icon-${size}.png`));
}

// Apple touch icon (180x180).
await sharp(src)
  .resize(180, 180, { fit: "cover" })
  .png()
  .toFile(join(outDir, "apple-touch-icon.png"));

// Maskable: logo scaled to ~78% on a solid background for the safe zone.
const inner = Math.round(512 * 0.78);
const logo = await sharp(src).resize(inner, inner, { fit: "cover" }).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: bg },
})
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toFile(join(outDir, "icon-maskable-512.png"));

// Serve the original logo from /LOGO.jpg too.
await copyFile(src, join(root, "public", "LOGO.jpg"));

console.log("Icons generated in public/icons/");
