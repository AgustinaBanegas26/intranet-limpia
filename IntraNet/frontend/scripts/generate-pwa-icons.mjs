// Archivo de configuraci?n o entrada: conecta las piezas necesarias para iniciar o compilar el proyecto. Tema específico: instalación y actualización de la aplicación web progresiva.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicPwaDir = path.join(root, "public/pwa");
const iconsDir = path.join(root, "public/icons");
const publicDir = path.join(root, "public");
const brandRed = "#CC2627";

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SPLASH_SIZES = [
  { name: "splash-640x1136.png", width: 640, height: 1136 },
  { name: "splash-750x1334.png", width: 750, height: 1334 },
  { name: "splash-1242x2208.png", width: 1242, height: 2208 },
  { name: "splash-1284x2778.png", width: 1284, height: 2778 },
];

function iconLabelSvg(size) {
  const titleSize = Math.round(size * 0.125);
  const subtitleSize = Math.round(size * 0.055);
  const titleY = Math.round(size * 0.48);
  const subtitleY = Math.round(size * 0.58);
  const ruleWidth = Math.round(size * 0.18);
  const ruleY = Math.round(size * 0.66);

  return Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="${titleY}" text-anchor="middle" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="700" letter-spacing="${Math.round(size * 0.006)}">INTRANET</text>
    <text x="50%" y="${subtitleY}" text-anchor="middle" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="${subtitleSize}" font-weight="600" letter-spacing="${Math.round(size * 0.014)}">EMPRESARIAL</text>
    <rect x="${Math.round((size - ruleWidth) / 2)}" y="${ruleY}" width="${ruleWidth}" height="${Math.max(2, Math.round(size * 0.012))}" rx="${Math.round(size * 0.006)}" fill="#fff" opacity="0.8"/>
  </svg>`);
}

async function generateIcon(size, target) {
  const artwork = iconLabelSvg(size);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: brandRed,
    },
  })
    .composite([{ input: artwork }])
    .png()
    .toFile(target);
}

async function generateSplash(width, height, target) {
  const titleSize = Math.round(Math.min(width, height) * 0.09);
  const subtitleSize = Math.round(titleSize * 0.42);
  const label = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="${Math.round(height * 0.48)}" text-anchor="middle" fill="${brandRed}" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="700" letter-spacing="${Math.round(titleSize * 0.05)}">INTRANET</text>
    <text x="50%" y="${Math.round(height * 0.53)}" text-anchor="middle" fill="#333" font-family="Arial, Helvetica, sans-serif" font-size="${subtitleSize}" font-weight="600" letter-spacing="${Math.round(subtitleSize * 0.12)}">EMPRESARIAL</text>
  </svg>`);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: "#F7F7F7",
    },
  })
    .composite([{ input: label }])
    .png()
    .toFile(target);
}

await mkdir(iconsDir, { recursive: true });
await mkdir(publicPwaDir, { recursive: true });

for (const size of ICON_SIZES) {
  const target = path.join(iconsDir, `icon-${size}x${size}.png`);
  await generateIcon(size, target);
  console.log(`Generated ${target}`);
}

await generateIcon(180, path.join(iconsDir, "apple-touch-icon.png"));
await generateIcon(192, path.join(publicDir, "logo.png"));
await generateIcon(64, path.join(publicDir, "favicon.png"));
await generateIcon(192, path.join(iconsDir, "icon-tab.png"));
await generateIcon(512, path.join(publicPwaDir, "icon.png"));

for (const { name, width, height } of SPLASH_SIZES) {
  await generateSplash(width, height, path.join(publicPwaDir, name));
}

await generateSplash(1284, 2778, path.join(publicPwaDir, "splash.png"));
console.log("PWA icons and splash screens ready.");
