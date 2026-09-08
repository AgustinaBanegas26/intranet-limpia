import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicPwaDir = path.join(root, "public/pwa");
const iconsDir = path.join(root, "public/icons");
const publicDir = path.join(root, "public");

const MANIFEST_ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SPLASH_SIZES = [
  { name: "splash-640x1136.png", width: 640, height: 1136 },
  { name: "splash-750x1334.png", width: 750, height: 1334 },
  { name: "splash-1242x2208.png", width: 1242, height: 2208 },
  { name: "splash-1284x2778.png", width: 1284, height: 2778 },
];
async function generateFavicon(size, target) {
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toFile(target);
}

async function generateSquareIcon(size, target) {
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toFile(target);
}

async function generateSplash(width, height, target) {
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 204, g: 38, b: 39, alpha: 1 },
    },
  })
    .png()
    .toFile(target);
}

await mkdir(iconsDir, { recursive: true });
await mkdir(publicPwaDir, { recursive: true });

console.log("Generating neutral transparent PWA assets.");

for (const size of MANIFEST_ICON_SIZES) {
  const name = `icon-${size}x${size}.png`;
  const target = path.join(iconsDir, name);
  await generateSquareIcon(size, target);
  console.log(`Generated ${target}`);
}

const appleTouchTarget = path.join(iconsDir, "apple-touch-icon.png");
await generateSquareIcon(180, appleTouchTarget);
console.log(`Generated ${appleTouchTarget}`);

const logoTarget = path.join(publicDir, "logo.png");
await generateSquareIcon(192, logoTarget);
console.log(`Generated ${logoTarget}`);

for (const { name, width, height } of SPLASH_SIZES) {
  const target = path.join(publicPwaDir, name);
  await generateSplash(width, height, target);
  console.log(`Generated ${target}`);
}

const defaultSplash = path.join(publicPwaDir, "splash.png");
await generateSplash(1284, 2778, defaultSplash);
console.log(`Generated ${defaultSplash}`);

const faviconTarget = path.join(publicDir, "favicon.png");
const tabIconTarget = path.join(iconsDir, "icon-tab.png");
await generateFavicon(32, faviconTarget);
await generateFavicon(192, tabIconTarget);
console.log(`Generated ${faviconTarget}`);
console.log(`Generated ${tabIconTarget}`);

console.log("PWA icons and splash screens ready.");
