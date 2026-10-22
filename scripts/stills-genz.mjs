/**
 * Planche de contrôle de la pub Gen Z : une image par instant demandé (secondes), un seul bundle.
 * Usage : node scripts/stills-genz.mjs <sortie.png> t1 t2 …
 */
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [out, ...ts] = process.argv.slice(2);
const dir = fs.mkdtempSync(path.join(path.dirname(path.resolve(out)), 'stills-'));
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id: 'AdGenZ9x16', chromiumOptions: { gl: 'swangle' } });
const files = [];
for (const t of ts) {
  const file = path.join(dir, `${t}.png`);
  await renderStill({ serveUrl, composition, output: file, frame: Math.round(Number(t) * 60), scale: 0.5, chromiumOptions: { gl: 'swangle' } });
  files.push(file);
}
const labels = ts.flatMap((t, i) => ['-label', `${t}s`, files[i]]);
execFileSync('montage', [...labels, '-tile', `${Math.min(8, ts.length)}x`, '-geometry', '270x480+4+4', '-pointsize', '18', '-background', '#333', '-fill', '#ffd27a', out]);
console.log(out, dir, os.cpus().length);
