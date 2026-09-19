// Script único usado para gerar os ícones PNG do PWA "Governo Interior" a
// partir de SVG vetorial. `sharp` não é dependência do projeto (só serve
// pra isso) — rode `npm i -D sharp` antes de `node scripts/gerar-icones-governo-interior.mjs`
// se precisar regenerar os ícones, depois pode remover com `npm uninstall sharp`.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "icons", "governo-interior");
mkdirSync(OUT, { recursive: true });

const BG = "#0b1220";
const RING = "#c8a24d";
const NEEDLE = "#e8c877";

// Glyph: bússola simplificada — um anel fino e uma agulha/diamante central,
// remetendo a "governo interior" (a bússola que orienta por dentro).
function glyph(cx, cy, r) {
  const ringR = r * 0.86;
  const needleLen = r * 0.62;
  return `
    <circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="${RING}" stroke-width="${r * 0.055}" />
    <circle cx="${cx}" cy="${cy}" r="${r * 0.05}" fill="${NEEDLE}" />
    <path d="M ${cx} ${cy - needleLen} L ${cx + r * 0.13} ${cy} L ${cx} ${cy + needleLen * 0.55} L ${cx - r * 0.13} ${cy} Z" fill="${NEEDLE}" />
    <path d="M ${cx} ${cy - needleLen * 0.32} L ${cx + r * 0.075} ${cy} L ${cx} ${cy + needleLen} L ${cx - r * 0.075} ${cy} Z" fill="${RING}" opacity="0.55" />
  `;
}

function svgAny(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${BG}" />
    ${glyph(cx, cy, r)}
  </svg>`;
}

function svgMaskable(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.3; // menor, respeitando a área segura (~80% central)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${BG}" />
    ${glyph(cx, cy, r)}
  </svg>`;
}

async function gerar(nome, svg, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`${OUT}/${nome}`);
  console.log("gerado", nome);
}

await gerar("icon-192.png", svgAny(192), 192);
await gerar("icon-512.png", svgAny(512), 512);
await gerar("icon-192-maskable.png", svgMaskable(192), 192);
await gerar("icon-512-maskable.png", svgMaskable(512), 512);

// Ícone "apple touch" — iOS ignora maskable/manifest; precisa de um PNG
// próprio, sem cantos arredondados (o próprio iOS aplica o recorte).
async function svgApple(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${BG}" />
    ${glyph(cx, cy, r)}
  </svg>`;
}
await gerar("apple-icon-180.png", await svgApple(180), 180);
