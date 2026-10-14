// Gera as capas abstratas dos dados de demonstração (PNG 600x800) nas cores do cineclube: node ferramentas/gerar-capas.mjs
// (o script fica fora de demo-imagens/, que a API publica em /demo)
import zlib from 'node:zlib';
import fs from 'node:fs';

const W = 600, H = 800;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const C = { cream: hex('#F2EDD6'), roxo: hex('#261840'), pink: hex('#E8368C'), olive: hex('#B5BB38'), gold: hex('#C8A030'), azul: hex('#6B72B8'), tinta: hex('#2B2040') };

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(tipo, dados) {
  const len = Buffer.alloc(4); len.writeUInt32BE(dados.length);
  const td = Buffer.concat([Buffer.from(tipo), dados]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(pixel) {
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const [r, g, b] = pixel(x, y);
      const o = y * (W * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
// grão de papel impresso
const grao = (c) => c;

const capas = {
  'capa-revista-1.png': (x, y) => {
    let c = C.roxo;
    if (y > 520) c = C.pink;
    if ((x - 300) ** 2 + (y - 300) ** 2 < 170 ** 2) c = C.olive;
    if (x > 60 && x < 540 && y > 640 && y < 660) c = C.cream;
    return grao(c, x, y);
  },
  'capa-catalogo-bressane.png': (x, y) => {
    let c = C.cream;
    if (Math.floor(x / 75) % 2 === 0 && y < 560) c = C.azul;
    if (y >= 560) c = C.tinta;
    if (x > 380 && y > 600 && y < 760) c = C.gold;
    return grao(c, x, y);
  },
  'capa-catalogo-sirk.png': (x, y) => {
    let c = C.pink;
    if (y > 400) c = C.roxo;
    if (x + y > 760 && x + y < 860) c = C.gold;
    return grao(c, x, y);
  },
  'capa-revista-2.png': (x, y) => {
    let c = C.cream;
    if (x < 200) c = C.azul;
    if (y > 470 && y < 610) c = C.pink;
    if (x >= 200 && (x - 420) ** 2 + (y - 260) ** 2 < 120 ** 2) c = C.roxo;
    return grao(c, x, y);
  },
  'capa-ciclo-comedia.png': (x, y) => {
    let c = C.gold;
    if (Math.floor(y / 100) % 2 === 1) c = C.cream;
    if (x > 120 && x < 480 && y > 320 && y < 480) c = C.pink;
    return grao(c, x, y);
  },
  'capa-ciclo-tempo.png': (x, y) => {
    let c = C.tinta;
    const r = Math.hypot(x - 300, y - 420);
    if (Math.floor(r / 40) % 2 === 0) c = C.roxo;
    if (y < 120) c = C.olive;
    return grao(c, x, y);
  },
};
for (const [nome, f] of Object.entries(capas)) fs.writeFileSync(new URL(`../demo-imagens/${nome}`, import.meta.url), png(f));
console.log('capas geradas');
