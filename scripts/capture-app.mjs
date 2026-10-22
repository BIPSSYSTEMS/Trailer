// Captures des vrais écrans de l'app BIPS (export web Expo) au format iPhone, pour la vidéo investisseurs.
//
// Usage :
//   (dans BIPS-SYSTEME) npx expo export --platform web --output-dir <dist>
//   node scripts/capture-app.mjs <dist> [route…]
// Sortie : public/app-screens/<nom>.jpg (1170 × 2532, iPhone 3×).
// Les parcours (FLOWS) enchaînent clics, taps et défilements pour capturer chaque étape d'une fonctionnalité.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [dist, ...only] = process.argv.slice(2);
const OUT = path.resolve('public/app-screens');
fs.mkdirSync(OUT, { recursive: true });

// Petit serveur statique avec repli sur index.html (routes Expo Router côté client).
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.ttf': 'font/ttf', '.otf': 'font/otf', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(dist, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4173, r));

/** [nom, route, attente ms, défilements (px) à capturer en plus : <nom>-1.png, <nom>-2.png…] */
const SHOTS = [
  ['home', '/'],
  ['parcours', '/parcours'],
  ['lecon', '/parcours/lecon/actions-1', 3000],
  ['marches', '/marches'],
  ['btc', '/marches/btc', 4000],
  ['ordre', '/marches/ordre?id=btc&side=buy', 3000, [500]],
  ['simulation', '/marches/simulation/btc', 6000, [600, 1200]],
  ['portefeuille', '/marches/portefeuille'],
  ['scenarios', '/scenarios', 2500, [500]],
  ['scenario', '/scenarios/lehman', 3000, [500, 1000]],
  ['hedge', '/hedge'],
  ['couverture', '/hedge/couverture', 3000, [600, 1200]],
  ['regimes', '/hedge/regimes', 3000, [600]],
  ['carte', '/carte', 4000],
  ['pays-fra', '/carte/FRA', 3500, [600, 1200, 1800]],
  ['pays-usa', '/carte/USA', 3500, [600, 1200]],
  ['pays-chn', '/carte/CHN', 3500, [600, 1200]],
  ['profil', '/profil'],
  ['revision', '/revision'],
  ['examens', '/examens'],
].filter(([n]) => !only.length || only.includes(n));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'fr-FR', colorScheme: 'light' });
const page = await ctx.newPage();

// Création du personnage (premier lancement) : prénom puis « Continuer ».
await page.goto('http://localhost:4173/personnage', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(2000);
await page.getByPlaceholder('Ton prénom').fill('Alex').catch(() => {});
await page.getByText('Continuer', { exact: true }).click().catch(() => {});
await page.waitForTimeout(1500);

for (const [name, route, wait = 2500, scrolls = []] of SHOTS) {
  await page.goto(`http://localhost:4173${route}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(wait);
  await page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 90 });
  console.log(name, route, '→', page.url());
  for (const [i, y] of scrolls.entries()) {
    // Défilement à la molette au centre de l'écran (les ScrollView de react-native-web réagissent à la roue).
    await page.mouse.move(195, 500);
    await page.mouse.wheel(0, y - (scrolls[i - 1] ?? 0));
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, `${name}-${i + 1}.jpg`), type: 'jpeg', quality: 90 });
  }
}

// Parcours interactifs : chaque étape peut cliquer un texte, toucher un point, défiler, attendre, capturer.
const FLOWS = [
  {
    name: 'carte',
    steps: [
      { goto: '/carte', wait: 3500 },
      { shot: 'map-base' },
      { click: 'Exportations', wait: 1500 },
      { shot: 'map-exports' },
      { tap: [108, 228], wait: 2500 },
      { shot: 'map-fra' },
      { goto: '/carte/FRA', wait: 3000 },
      { shot: 'fiche-fra' },
      { wheel: 650, wait: 900 },
      { shot: 'fiche-fra-clients' },
      { wheel: 450, wait: 900 },
      { shot: 'fiche-fra-exporte' },
    ],
  },
  {
    name: 'scenario',
    steps: [
      { goto: '/scenarios', wait: 2500 },
      { shot: 'scn-liste' },
      { goto: '/scenarios/lehman', wait: 3000 },
      { shot: 'scn-brief' },
      { click: 'Prendre mon parti', wait: 1500 },
      { shot: 'scn-parti' },
      { click: 'En baisse de 2 à 6 %', wait: 500 },
      { click: 'Perd plus de 100 pb', wait: 500 },
      { shot: 'scn-parti-choix' },
      { click: 'En chute de plus de 30 %', wait: 400 },
      { clickLast: 'En chute de plus de 20 %', wait: 400 },
      { click: 'Lancer la vraie courbe', wait: 1500 },
      { shot: 'scn-lecture-1' },
      { wait: 2500 },
      { shot: 'scn-lecture-2' },
      { wait: 4000 },
      { shot: 'scn-lecture-3' },
      { wait: 6000 },
      { shot: 'scn-lecture-4' },
      { wait: 9000 },
      { shot: 'scn-fin' },
      { wheel: 700, wait: 900 },
      { shot: 'scn-fin-2' },
      { wheel: 700, wait: 900 },
      { shot: 'scn-fin-3' },
      { click: 'Révéler l’événement', wait: 2500 },
      { shot: 'scn-revele' },
      { wheel: 600, wait: 900 },
      { shot: 'scn-revele-2' },
    ],
  },
  {
    name: 'trading',
    steps: [
      { goto: '/marches/btc', wait: 4000 },
      { shot: 'btc' },
      { goto: '/marches/ordre?id=btc&side=buy', wait: 3000 },
      { shot: 'ordre' },
      { click: 'OCO', wait: 800 },
      { shot: 'ordre-oco' },
      { goto: '/marches/simulation/btc', wait: 6000 },
      { shot: 'simulation' },
      { wheel: 700, wait: 900 },
      { shot: 'simulation-2' },
    ],
  },
].filter((fl) => !only.length || only.includes(fl.name));

for (const fl of FLOWS) {
  for (const st of fl.steps) {
    try {
      if (st.goto) await page.goto(`http://localhost:4173${st.goto}`, { waitUntil: 'networkidle', timeout: 30000 });
      if (st.click) await page.getByText(st.click, { exact: true }).first().click({ timeout: 5000 });
      if (st.clickLast) await page.getByText(st.clickLast, { exact: true }).last().click({ timeout: 5000 });
      if (st.tap) await page.mouse.click(...st.tap);
      if (st.wheel) {
        await page.mouse.move(195, 500);
        await page.mouse.wheel(0, st.wheel);
      }
      if (st.wait) await page.waitForTimeout(st.wait);
      if (st.shot) {
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT, `${st.shot}.jpg`), type: 'jpeg', quality: 90 });
        console.log(fl.name, '→', st.shot);
      }
    } catch (e) {
      console.log(fl.name, 'étape ratée', JSON.stringify(st), String(e).slice(0, 120));
    }
  }
}
await browser.close();
server.close();
