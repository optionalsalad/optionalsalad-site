// Builds the Optional Salad logo set into public/brand/ and the site icons into public/.
// The wordmark is DM Serif Display converted to outlines, so the files need no font installed.
//
//   cd brand && npm install && node build.mjs
//
// Then commit public/. The mark's shapes live in this file — edit here, never in the outputs.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '..', 'public');
const out = join(pub, 'brand');
const font = opentype.loadSync(join(here, 'fonts', 'DMSerifDisplay-Regular.ttf'));

// ── Colours ────────────────────────────────────────────────────────────────
const C = {
  charcoal: '#1E2525', cream: '#F8F6F1', sage: '#7FA882', sageDeep: '#3F6E4C',
  sageLight: '#9DC4A0', tomato: '#E07B6A', cucumber: '#C9DEC5', cucumberLight: '#E4EFE2', tile: '#EDF3ED',
};
const LIGHT = { back: C.sageDeep, front: C.sage, tom: C.tomato, cuc: C.cucumber, bowl: C.charcoal, rib: C.cream, text: C.charcoal, accent: C.sageDeep };
const DARK = { back: C.sage, front: C.sageLight, tom: C.tomato, cuc: C.cucumberLight, bowl: C.cream, rib: C.charcoal, text: C.cream, accent: C.sageLight };

// ── The mark (64×64 grid) ──────────────────────────────────────────────────
// A heaped salad bowl with two tossed leaves. `small` drops the detail for 16–24px use.
const LEAF = 'M0 0 C-11 -6 -12 -22 1 -32 C10 -22 9 -7 0 0 Z';
const leaf = (t, fill, rib) => `<g transform="${t}"><path d="${LEAF}" fill="${fill}"/>` +
  (rib ? `<path d="M0 -3 C-1 -12 -1 -20 1 -27" fill="none" stroke="${rib}" stroke-width="1.6" stroke-linecap="round"/>` : '') + '</g>';
const mark = (p, small = false) =>
  (small ? '' : leaf('translate(22 33) rotate(-34) scale(.75)', p.back, p.rib)) +
  `<path d="M10 37 C8 30 13 25 19 27 C20 20 28 17 32 22 C35 16 45 17 46 24 C52 23 56 29 54 37 Z" fill="${p.back}"/>` +
  leaf('translate(30 32) rotate(6) scale(.9)', p.front, small ? null : p.rib) +
  `<path d="M7 37 C6 32 10 29 15 31 C17 26 24 25 27 29 C30 25 37 26 38 31 C42 28 49 30 49 37 Z" fill="${p.front}"/>` +
  `<circle cx="42" cy="29" r="${small ? 8 : 6.5}" fill="${p.tom}"/>` +
  (small ? '' : `<circle cx="51" cy="33" r="4.5" fill="${p.cuc}" stroke="${p.front}" stroke-width="1.5"/>`) +
  `<path d="M4 36 H60 C60 49 48 58 32 58 C16 58 4 49 4 36 Z" fill="${p.bowl}"/>`;
const MARK_BOX = { x: 4, y: 2, w: 56, h: 56 }; // visual extent of the mark in its 64 grid

// ── Wordmark, as outlines ──────────────────────────────────────────────────
const TRACKING = -0.025; // em, matches the site's letter-spacing
function words(text, size) {
  // Lays out glyphs by hand so tracking applies; returns path data and advance width.
  const scale = size / font.unitsPerEm;
  let x = 0, d = '';
  const glyphs = font.stringToGlyphs(text);
  glyphs.forEach((g, i) => {
    d += g.getPath(x, 0, size).toPathData(2);
    x += g.advanceWidth * scale + TRACKING * size;
    if (i < glyphs.length - 1) x += font.getKerningValue(g, glyphs[i + 1]) * scale;
  });
  return { d, w: x - TRACKING * size };
}
const CAP = font.tables.os2.sCapHeight / font.unitsPerEm;
function wordmark(p, size, x, baseline) {
  const a = words('Optional ', size), b = words('Salad', size);
  return {
    svg: `<path transform="translate(${r(x)} ${r(baseline)})" d="${a.d}" fill="${p.text}"/>` +
      `<path transform="translate(${r(x + a.w)} ${r(baseline)})" d="${b.d}" fill="${p.accent}"/>`,
    w: a.w + b.w,
  };
}
const r = (n) => Math.round(n * 100) / 100;
const svgDoc = (w, h, body, label = 'Optional Salad') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(w)} ${r(h)}" width="${r(w)}" height="${r(h)}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>\n`;
const place = (p, small, x, y, size) => {
  const s = size / MARK_BOX.h;
  return `<g transform="translate(${r(x - MARK_BOX.x * s)} ${r(y - MARK_BOX.y * s)}) scale(${r(s * 1000) / 1000})">${mark(p, small)}</g>`;
};

// ── Lockups ────────────────────────────────────────────────────────────────
const PAD = 8;
function horizontal(p) {
  const text = 60, m = 84, gap = 22;
  const markY = PAD, mid = markY + m * 0.55; // optical centre sits on the greens, not the bowl base
  const baseline = mid + (CAP * text) / 2;
  const wm = wordmark(p, text, PAD + m + gap, baseline);
  const descent = 0.24 * text;
  return svgDoc(PAD + m + gap + wm.w + PAD, Math.max(PAD + m + PAD, baseline + descent + PAD),
    place(p, false, PAD, markY, m) + wm.svg);
}
function stacked(p) {
  const m = 96, text = 44, line = text * 1.05, gap = 16;
  const a = words('Optional', text), b = words('Salad', text);
  const w = Math.max(m, a.w, b.w) + PAD * 2;
  const top = PAD + m + gap + CAP * text;
  return svgDoc(w, top + line + 0.24 * text + PAD,
    place(p, false, (w - m) / 2, PAD, m) +
    `<path transform="translate(${r((w - a.w) / 2)} ${r(top)})" d="${a.d}" fill="${p.text}"/>` +
    `<path transform="translate(${r((w - b.w) / 2)} ${r(top + line)})" d="${b.d}" fill="${p.accent}"/>`);
}
function wordOnly(p) {
  const text = 60, baseline = PAD + CAP * text + 4;
  const wm = wordmark(p, text, PAD, baseline);
  return svgDoc(PAD * 2 + wm.w, baseline + 0.24 * text + PAD, wm.svg);
}
const markOnly = (p, small = false) => svgDoc(64, 64, place(p, small, 4, 4, 56), 'Optional Salad mark');
// Square icon: tinted tile with the mark inset. `round` for favicons; square for stores/socials (they mask it).
const icon = (opts = {}) => {
  const { round = false, small = false, inset = 0.72 } = opts;
  const m = 64 * inset, o = (64 - m) / 2;
  const bg = round ? `<rect width="64" height="64" rx="14" fill="${C.tile}"/>` : `<rect width="64" height="64" fill="${C.tile}"/>`;
  return svgDoc(64, 64, bg + place(LIGHT, small, o, o - 1, m), 'Optional Salad');
};
const socialCard = () => {
  // 1200×630 link preview: horizontal lockup centred on cream.
  const h = horizontal(LIGHT);
  const [, w0, h0] = h.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  const s = 760 / w0;
  const inner = h.replace(/^<svg[^>]*>(<title>.*?<\/title>)?/, '').replace(/<\/svg>\n$/, '');
  return svgDoc(1200, 630, `<rect width="1200" height="630" fill="${C.cream}"/>` +
    `<g transform="translate(${r((1200 - w0 * s) / 2)} ${r((630 - h0 * s) / 2)}) scale(${r(s * 1000) / 1000})">${inner}</g>`);
};

// ── Write ──────────────────────────────────────────────────────────────────
const write = (file, data) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, data); console.log('wrote', file.startsWith(pub) ? file.slice(pub.length + 1) : file.slice(here.length + 1)); };
const png = (svg, width) => new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();

const svgs = {
  'optional-salad-logo-horizontal': horizontal(LIGHT),
  'optional-salad-logo-horizontal-dark': horizontal(DARK),
  'optional-salad-logo-stacked': stacked(LIGHT),
  'optional-salad-logo-stacked-dark': stacked(DARK),
  'optional-salad-wordmark': wordOnly(LIGHT),
  'optional-salad-wordmark-dark': wordOnly(DARK),
  'optional-salad-mark': markOnly(LIGHT),
  'optional-salad-mark-dark': markOnly(DARK),
  'optional-salad-mark-small': markOnly(LIGHT, true),
  'optional-salad-icon': icon(),
};
for (const [name, svg] of Object.entries(svgs)) write(join(out, 'svg', name + '.svg'), svg);

// PNGs at the sizes people actually ask for.
const pngs = [
  ['optional-salad-logo-horizontal', [600, 1200, 2400]], // 600 = email signature (shown at 300)
  ['optional-salad-logo-horizontal-dark', [600, 1200, 2400]],
  ['optional-salad-logo-stacked', [600, 1200]],
  ['optional-salad-logo-stacked-dark', [600, 1200]],
  ['optional-salad-wordmark', [1200]],
  ['optional-salad-wordmark-dark', [1200]],
  ['optional-salad-mark', [256, 512, 1024]],
  ['optional-salad-mark-dark', [512, 1024]],
  ['optional-salad-icon', [400, 1024]], // 400 = social profile picture, 1024 = store/app listing
];
for (const [name, widths] of pngs) for (const w of widths) write(join(out, 'png', `${name}-${w}.png`), png(svgs[name], w));
const card = socialCard();
write(join(out, 'svg', 'optional-salad-social-card.svg'), card);
write(join(out, 'png', 'optional-salad-social-card-1200x630.png'), png(card, 1200));

// Site icons.
const fav = icon({ round: true, small: true, inset: 0.86 });
write(join(pub, 'favicon.svg'), fav);
write(join(pub, 'apple-touch-icon.png'), png(icon({ inset: 0.7 }), 180));
write(join(pub, 'icon-192.png'), png(icon({ round: true }), 192));
write(join(pub, 'icon-512.png'), png(icon({ round: true }), 512));
write(join(pub, 'icon-maskable-512.png'), png(icon({ inset: 0.56 }), 512)); // inside the 80% safe zone
// favicon.ico: 16, 32 and 48 px PNGs in one ICO container.
const sizes = [16, 32, 48];
const images = sizes.map((s) => png(s < 32 ? fav : icon({ round: true, inset: 0.84 }), s));
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let offset = head.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(images[i].length, e + 8); head.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
write(join(pub, 'favicon.ico'), Buffer.concat([head, ...images]));
write(join(pub, 'site.webmanifest'), JSON.stringify({
  name: 'Optional Salad', short_name: 'Optional Salad', start_url: '/', display: 'browser',
  background_color: C.cream, theme_color: C.cream,
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2) + '\n');
// The header mark, inlined by tools/build.mjs.
write(join(here, 'header-mark.svg'), `<svg class="logo-mark" viewBox="4 2 56 56" width="32" height="32" aria-hidden="true" focusable="false">${mark(LIGHT)}</svg>`);
