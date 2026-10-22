// Convertit Inter Black en police « typeface » de three.js (pour le logo BIPS extrudé en 3D).
// Usage : node scripts/make-typeface.mjs [Inter-Black.otf] [inter-black]  → public/fonts/<nom>.typeface.json
import fs from 'node:fs';
import opentype from 'opentype.js';

const [src = 'Inter-Black.otf', name = 'inter-black'] = process.argv.slice(2);
const font = opentype.parse(fs.readFileSync(`public/fonts/${src}`).buffer);
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?\'’-&ÉÈÊÀÂÔÛÇéèêàâôûç% ';
const r = (n) => Math.round(n);
const glyphs = {};
for (const ch of chars) {
  const g = font.charToGlyph(ch);
  const o = [];
  for (const c of g.path.commands) {
    if (c.type === 'M') o.push('m', r(c.x), r(c.y));
    else if (c.type === 'L') o.push('l', r(c.x), r(c.y));
    else if (c.type === 'Q') o.push('q', r(c.x), r(c.y), r(c.x1), r(c.y1));
    else if (c.type === 'C') o.push('b', r(c.x), r(c.y), r(c.x1), r(c.y1), r(c.x2), r(c.y2));
  }
  const bb = g.getBoundingBox();
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o: o.join(' ') };
}
const out = {
  glyphs,
  familyName: name,
  ascender: font.ascender,
  descender: font.descender,
  underlinePosition: font.tables.post.underlinePosition,
  underlineThickness: font.tables.post.underlineThickness,
  boundingBox: { xMin: font.tables.head.xMin, yMin: font.tables.head.yMin, xMax: font.tables.head.xMax, yMax: font.tables.head.yMax },
  resolution: font.unitsPerEm,
  original_font_information: { format: 0, fontFamily: 'Inter', fontSubfamily: 'Black' },
};
fs.writeFileSync(`public/fonts/${name}.typeface.json`, JSON.stringify(out));
console.log('glyphes', Object.keys(glyphs).length);
