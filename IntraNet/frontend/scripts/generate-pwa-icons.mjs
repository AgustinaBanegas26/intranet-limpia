import { access, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
//hola
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const publicPwaDir = path.join(root, 'public/pwa')
const iconsDir = path.join(root, 'public/icons')
const publicDir = path.join(root, 'public')

const MANIFEST_ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const SPLASH_SIZES = [
  { name: 'splash-640x1136.png', width: 640, height: 1136 },
  { name: 'splash-750x1334.png', width: 750, height: 1334 },
  { name: 'splash-1242x2208.png', width: 1242, height: 2208 },
  { name: 'splash-1284x2778.png', width: 1284, height: 2778 },
]
//hllooo
async function resolveSourceIcon() {
  const png = path.join(publicPwaDir, 'icon.png')
  const svg = path.join(publicPwaDir, 'icon.svg')

  try {
    await access(png)
    return png
  } catch {
    try {
      await access(svg)
      return svg
    } catch {
      throw new Error('No se encontro public/pwa/icon.png ni public/pwa/icon.svg')
    }
  }
}

async function generateFavicon(source, size, target) {
  await sharp(source)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(target)
}

async function generateSquareIcon(source, size, target) {
  await sharp(source)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 247, g: 247, b: 247, alpha: 1 },
    })
    .png()
    .toFile(target)
}

async function generateSplash(source, width, height, target) {
  const iconSize = Math.round(Math.min(width, height) * 0.28)

  const iconBuffer = await sharp(source)
    .resize(iconSize, iconSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 204, g: 38, b: 39, alpha: 1 },
    },
  })
    .composite([{ input: iconBuffer, gravity: 'center' }])
    .png()
    .toFile(target)
}

const source = await resolveSourceIcon()

await mkdir(iconsDir, { recursive: true })
await mkdir(publicPwaDir, { recursive: true })

console.log(`Using source icon: ${source}`)

for (const size of MANIFEST_ICON_SIZES) {
  const name = `icon-${size}x${size}.png`
  const target = path.join(iconsDir, name)
  await generateSquareIcon(source, size, target)
  console.log(`Generated ${target}`)
}

const appleTouchTarget = path.join(iconsDir, 'apple-touch-icon.png')
await generateSquareIcon(source, 180, appleTouchTarget)
console.log(`Generated ${appleTouchTarget}`)

const logoTarget = path.join(publicDir, 'logo.png')
await generateSquareIcon(source, 192, logoTarget)
console.log(`Generated ${logoTarget}`)

for (const { name, width, height } of SPLASH_SIZES) {
  const target = path.join(publicPwaDir, name)
  await generateSplash(source, width, height, target)
  console.log(`Generated ${target}`)
}

const defaultSplash = path.join(publicPwaDir, 'splash.png')
await generateSplash(source, 1284, 2778, defaultSplash)
console.log(`Generated ${defaultSplash}`)

const soloIconSource = path.join(root, 'src/assets/icono-rojo-solo logo.png')
const faviconTarget = path.join(publicDir, 'favicon.png')
const tabIconTarget = path.join(iconsDir, 'icon-tab.png')
await generateFavicon(soloIconSource, 32, faviconTarget)
await generateFavicon(soloIconSource, 192, tabIconTarget)
console.log(`Generated ${faviconTarget}`)
console.log(`Generated ${tabIconTarget}`)

console.log('PWA icons and splash screens ready.')
