const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const rootDir = path.resolve(__dirname, '..');
const mobileDir = path.join(rootDir, 'packages', 'customer-provider-mobile');
const logoPath = path.join(mobileDir, 'public', 'logo.png');

console.log('Reading source logo from:', logoPath);
const srcData = fs.readFileSync(logoPath);
const srcPng = PNG.sync.read(srcData);

// 1. Identify Calendar Emblem bounding box: x in [74, 227], y in [5, 118]
const embX0 = 74, embX1 = 227;
const embY0 = 5, embY1 = 118;
const embW = embX1 - embX0 + 1; // 154
const embH = embY1 - embY0 + 1; // 114

const bgR = srcPng.data[0];
const bgG = srcPng.data[1];
const bgB = srcPng.data[2];

// Extract isolated emblem with transparent background
const emblem = new PNG({ width: embW, height: embH });
for (let y = 0; y < embH; y++) {
  for (let x = 0; x < embW; x++) {
    const srcIdx = ((y + embY0) * srcPng.width + (x + embX0)) * 4;
    const destIdx = (y * embW + x) * 4;
    const r = srcPng.data[srcIdx];
    const g = srcPng.data[srcIdx + 1];
    const b = srcPng.data[srcIdx + 2];
    const a = srcPng.data[srcIdx + 3];

    // Distance from off-white background
    const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
    if (dist < 35 && (x < 15 || x > embW - 15 || y < 15 || y > embH - 10)) {
      // Outside background is transparent
      emblem.data[destIdx] = 0;
      emblem.data[destIdx + 1] = 0;
      emblem.data[destIdx + 2] = 0;
      emblem.data[destIdx + 3] = 0;
    } else {
      emblem.data[destIdx] = r;
      emblem.data[destIdx + 1] = g;
      emblem.data[destIdx + 2] = b;
      emblem.data[destIdx + 3] = a;
    }
  }
}

// Bilinear scaling utility
function scalePNG(src, targetW, targetH) {
  const dest = new PNG({ width: targetW, height: targetH });
  const xRatio = src.width / targetW;
  const yRatio = src.height / targetH;

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const srcX = x * xRatio;
      const srcY = y * yRatio;
      const xFloor = Math.floor(srcX);
      const yFloor = Math.floor(srcY);
      const xFrac = srcX - xFloor;
      const yFrac = srcY - yFloor;

      const destIdx = (y * targetW + x) * 4;

      for (let c = 0; c < 4; c++) {
        const x1 = Math.min(src.width - 1, xFloor + 1);
        const y1 = Math.min(src.height - 1, yFloor + 1);

        const p00 = src.data[(yFloor * src.width + xFloor) * 4 + c];
        const p10 = src.data[(yFloor * src.width + x1) * 4 + c];
        const p01 = src.data[(y1 * src.width + xFloor) * 4 + c];
        const p11 = src.data[(y1 * src.width + x1) * 4 + c];

        const val =
          (1 - xFrac) * (1 - yFrac) * p00 +
          xFrac * (1 - yFrac) * p10 +
          (1 - xFrac) * yFrac * p01 +
          xFrac * yFrac * p11;

        dest.data[destIdx + c] = Math.round(val);
      }
    }
  }
  return dest;
}

// Draw image onto canvas with alpha blending
function composite(dest, src, startX, startY) {
  for (let y = 0; y < src.height; y++) {
    const destY = startY + y;
    if (destY < 0 || destY >= dest.height) continue;
    for (let x = 0; x < src.width; x++) {
      const destX = startX + x;
      if (destX < 0 || destX >= dest.width) continue;

      const srcIdx = (y * src.width + x) * 4;
      const destIdx = (destY * dest.width + destX) * 4;

      const srcA = src.data[srcIdx + 3] / 255;
      if (srcA <= 0) continue;

      const destA = dest.data[destIdx + 3] / 255;
      const outA = srcA + destA * (1 - srcA);

      for (let c = 0; c < 3; c++) {
        const srcC = src.data[srcIdx + c];
        const destC = dest.data[destIdx + c];
        const outC = (srcC * srcA + destC * destA * (1 - srcA)) / (outA || 1);
        dest.data[destIdx + c] = Math.round(outC);
      }
      dest.data[destIdx + 3] = Math.round(outA * 255);
    }
  }
}

// Helper to create solid canvas
function createSolid(width, height, r, g, b, a = 255) {
  const p = new PNG({ width, height });
  for (let i = 0; i < width * height * 4; i += 4) {
    p.data[i] = r;
    p.data[i + 1] = g;
    p.data[i + 2] = b;
    p.data[i + 3] = a;
  }
  return p;
}

// 2. Build 1024x1024 Adaptive Icon Foreground (Transparent background, centered in safe zone)
console.log('Generating assets/adaptive-icon.png (1024x1024)...');
const adaptiveFg1024 = createSolid(1024, 1024, 0, 0, 0, 0); // Transparent
// Safe zone diameter is 66% (675px). Make emblem width 520px (height ~385px)
const scaledFgW = 540;
const scaledFgH = Math.round((embH / embW) * scaledFgW); // ~400px
const scaledEmblem1024 = scalePNG(emblem, scaledFgW, scaledFgH);
composite(adaptiveFg1024, scaledEmblem1024, Math.round((1024 - scaledFgW) / 2), Math.round((1024 - scaledFgH) / 2));

const assetsDir = path.join(mobileDir, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), PNG.sync.write(adaptiveFg1024));

// 3. Build 1024x1024 App Icon (Solid #111114 obsidian background with centered emblem)
console.log('Generating assets/icon.png (1024x1024)...');
const icon1024 = createSolid(1024, 1024, 17, 17, 20, 255); // #111114
// Subtle brand accent circle
const centerX = 512, centerY = 512, radius = 380;
for (let y = 0; y < 1024; y++) {
  for (let x = 0; x < 1024; x++) {
    const d = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (d < radius) {
      const idx = (y * 1024 + x) * 4;
      const factor = (1 - d / radius) * 0.12; // 12% subtle green gradient in center
      icon1024.data[idx] = Math.min(255, Math.round(icon1024.data[idx] + 101 * factor));
      icon1024.data[idx + 1] = Math.min(255, Math.round(icon1024.data[idx + 1] + 179 * factor));
      icon1024.data[idx + 2] = Math.min(255, Math.round(icon1024.data[idx + 2] + 46 * factor));
    }
  }
}
composite(icon1024, scaledEmblem1024, Math.round((1024 - scaledFgW) / 2), Math.round((1024 - scaledFgH) / 2));
fs.writeFileSync(path.join(assetsDir, 'icon.png'), PNG.sync.write(icon1024));
fs.writeFileSync(path.join(mobileDir, 'public', 'app-icon.png'), PNG.sync.write(icon1024));

// 4. Generate Android Mipmap densities
const mipmaps = [
  { dir: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
  { dir: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
  { dir: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
  { dir: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
  { dir: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
];

const resDir = path.join(mobileDir, 'android', 'app', 'src', 'main', 'res');

for (const m of mipmaps) {
  const targetDir = path.join(resDir, m.dir);
  if (!fs.existsSync(targetDir)) continue;
  console.log(`Generating mipmaps for ${m.dir}...`);

  // Foreground (transparent, emblem inside 66% safe circle)
  const fg = createSolid(m.fgSize, m.fgSize, 0, 0, 0, 0);
  const fgEmbW = Math.round(m.fgSize * 0.55);
  const fgEmbH = Math.round((embH / embW) * fgEmbW);
  const scaledFg = scalePNG(emblem, fgEmbW, fgEmbH);
  composite(fg, scaledFg, Math.round((m.fgSize - fgEmbW) / 2), Math.round((m.fgSize - fgEmbH) / 2));

  // Legacy Icon (solid #111114 background)
  const icon = createSolid(m.iconSize, m.iconSize, 17, 17, 20, 255);
  const icEmbW = Math.round(m.iconSize * 0.72);
  const icEmbH = Math.round((embH / embW) * icEmbW);
  const scaledIc = scalePNG(emblem, icEmbW, icEmbH);
  composite(icon, scaledIc, Math.round((m.iconSize - icEmbW) / 2), Math.round((m.iconSize - icEmbH) / 2));

  // Round Icon
  const roundIcon = createSolid(m.iconSize, m.iconSize, 0, 0, 0, 0);
  const rRadius = m.iconSize / 2;
  for (let y = 0; y < m.iconSize; y++) {
    for (let x = 0; x < m.iconSize; x++) {
      const d = Math.sqrt((x - rRadius) ** 2 + (y - rRadius) ** 2);
      if (d <= rRadius) {
        const idx = (y * m.iconSize + x) * 4;
        roundIcon.data[idx] = 17;
        roundIcon.data[idx + 1] = 17;
        roundIcon.data[idx + 2] = 20;
        roundIcon.data[idx + 3] = 255;
      }
    }
  }
  composite(roundIcon, scaledIc, Math.round((m.iconSize - icEmbW) / 2), Math.round((m.iconSize - icEmbH) / 2));

  // Write PNG files
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), PNG.sync.write(fg));
  fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), PNG.sync.write(icon));
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), PNG.sync.write(roundIcon));

  // Clean obsolete webp files if present so Android strictly picks up the clean PNGs
  const oldFgWebp = path.join(targetDir, 'ic_launcher_foreground.webp');
  const oldIcWebp = path.join(targetDir, 'ic_launcher.webp');
  const oldRoundWebp = path.join(targetDir, 'ic_launcher_round.webp');
  if (fs.existsSync(oldFgWebp)) fs.unlinkSync(oldFgWebp);
  if (fs.existsSync(oldIcWebp)) fs.unlinkSync(oldIcWebp);
  if (fs.existsSync(oldRoundWebp)) fs.unlinkSync(oldRoundWebp);
}

console.log('✅ All App Icons & Adaptive Mipmaps generated successfully with pixel perfection!');

