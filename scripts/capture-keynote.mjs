// Captures des écrans de l'app (dernière version, export web Expo) pour la vidéo keynote Base Point.
//
// Usage :
//   (dans BIPS-SYSTEME) npx expo export --platform web --output-dir <dist>
//   node scripts/capture-keynote.mjs <dist> <dossier brut> [parcours…]
//   python3 scripts/frame_screens.py <dossier brut>   → public/keynote-screens/<nom>.jpg (iPhone 1170 × 2532)
//
// La fenêtre fait 390 × 756 points : la hauteur d'un iPhone moins la barre d'état (54) et l'indicateur
// d'accueil (34), que frame_screens.py rajoute autour de chaque capture.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [dist, RAW, ...only] = process.argv.slice(2);
fs.mkdirSync(RAW, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.ttf': 'font/ttf', '.otf': 'font/otf', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(dist, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4180, r));
const URL0 = 'http://localhost:4180';

// Progression d'un utilisateur de démonstration : quelques semaines d'usage, grade Associate.
const seed = () => {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  const done = { score: 5, total: 5, xp: 40, at: Date.now() - 86400000 };
  const ids = ['actions-1', 'actions-2', 'actions-3', 'obligations-1', 'hl-exposition-1', 'hl-exposition-2', 'hedge-exposition', 'hl-couverture-1', 'hl-couverture-2', 'hl-couverture-3'];
  const lessons = Object.fromEntries(ids.map((id) => [id, done]));
  localStorage.setItem('bips.progress.v1', JSON.stringify({ xp: 1840, lessons, days, events: [] }));
  localStorage.setItem('bips.character.v1', JSON.stringify({ name: 'Alex', gender: 'h' }));
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const makePage = async (scheme) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 756 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'fr-FR', colorScheme: scheme });
  await ctx.addInitScript(seed);
  return ctx.newPage();
};

const FLOWS = [
  {
    name: 'accueil',
    steps: [{ goto: '/', wait: 3500 }, { shot: 'home' }, { goto: '/examens', wait: 2500 }, { shot: 'examens' }],
  },
  {
    name: 'parcours',
    steps: [
      { goto: '/parcours', wait: 3500 },
      { shot: 'parcours' },
      { goto: '/parcours/lecon/actions-1', wait: 3000 },
      { shot: 'lecon-buddy' },
      { click: 'Continuer', wait: 1200 },
      { shot: 'lecon-concept' },
      { click: 'Continuer', wait: 900 },
      { click: 'Continuer', wait: 1200 },
      { shot: 'lecon-quiz' },
      { click: 'Ta mise de départ est garantie', wait: 900 },
      { shot: 'lecon-quiz-choix' },
      { click: 'Continuer', wait: 1200 },
      { shot: 'lecon-quiz-reponse' },
      { goto: '/parcours/lecon/obligations-2', wait: 3000 },
      { click: 'Continuer', wait: 1500 },
      { shot: 'lecon-courbe' },
      { goto: '/parcours/lecon/bips-1', wait: 3000 },
      { click: 'Continuer', wait: 1500 },
      { shot: 'lecon-bips' },
      { goto: '/boss/actions', wait: 3500 },
      { shot: 'examen-intro' },
    ],
  },
  {
    name: 'marches',
    steps: [
      { goto: '/marches', wait: 4000 },
      { shot: 'marches' },
      { goto: '/marches/btc', wait: 4500 },
      { shot: 'btc' },
      { goto: '/marches/ordre?id=btc&side=buy', wait: 3000 },
      { shot: 'ordre' },
      { click: 'OCO', wait: 900 },
      { shot: 'ordre-oco' },
      { goto: '/marches/simulation/btc', wait: 7000 },
      { shot: 'simulation' },
      { wheel: 620, wait: 1000 },
      { shot: 'simulation-2' },
      { goto: '/marches/portefeuille', wait: 3000 },
      { shot: 'portefeuille' },
    ],
  },
  {
    name: 'options',
    steps: [
      { goto: '/marches/options', wait: 3500 },
      { shot: 'options' },
      { goto: '/marches/options/btc', wait: 4000 },
      { shot: 'options-chaine' },
      { label: 'Call 85000', wait: 3000 },
      { shot: 'options-fiche' },
      { wheel: 520, wait: 1000 },
      { shot: 'options-fiche-2' },
      { wheel: 520, wait: 1000 },
      { shot: 'options-fiche-3' },
    ],
  },
  {
    name: 'hedge',
    steps: [
      { goto: '/hedge', wait: 3500 },
      { shot: 'hedge' },
      { wheel: 420, wait: 900 },
      { shot: 'hedge-2' },
      { goto: '/hedge/lecon/hl-couverture-2', wait: 3000 },
      { shot: 'hedge-lecon' },
      { click: 'Continuer', wait: 1200 },
      { shot: 'hedge-lecon-2' },
      { goto: '/hedge/labo/couverture', wait: 9000 },
      { shot: 'hedge-labo' },
      { wheel: 560, wait: 1500 },
      { shot: 'hedge-labo-2' },
      { wheel: 560, wait: 1500 },
      { shot: 'hedge-labo-3' },
    ],
  },
  {
    name: 'scenarios',
    steps: [
      { goto: '/scenarios', wait: 3000 },
      { shot: 'scn-liste' },
      { goto: '/scenarios/lehman', wait: 3500 },
      { shot: 'scn-brief' },
      { click: 'Prendre mon parti', wait: 1500 },
      { shot: 'scn-parti' },
      { click: 'Baisse de plus de 20 pb', wait: 500 },
      { click: 'Perd plus de 100 pb', wait: 500 },
      { shot: 'scn-parti-choix' },
      { click: 'Baisse', wait: 400 },
      { click: 'En chute de plus de 20 %', wait: 400 },
      { click: 'Lancer la vraie courbe', wait: 1500 },
      { shot: 'scn-lecture-1' },
      { wait: 4500 },
      { shot: 'scn-lecture-2' },
      { wait: 9000 },
      { shot: 'scn-lecture-3' },
      { wait: 12000 },
      { shot: 'scn-fin' },
      { click: 'Révéler l’événement', wait: 2500 },
      { shot: 'scn-revele' },
      { wheel: 650, wait: 1000 },
      { shot: 'scn-revele-2' },
    ],
  },
  {
    name: 'carte',
    steps: [
      { goto: '/carte', wait: 4500 },
      { shot: 'carte' },
      { click: 'Exportations', wait: 3500 },
      { shot: 'carte-exports' },
      { tap: [102, 214], wait: 3000 },
      { shot: 'carte-fra' },
      { goto: '/carte/FRA', wait: 3500 },
      { shot: 'fiche-fra' },
      { wheel: 650, wait: 1000 },
      { shot: 'fiche-fra-clients' },
    ],
  },
  {
    name: 'entretien',
    steps: [
      { goto: '/entretien', wait: 3000 },
      { shot: 'entretien' },
      { click: 'Multiplier vite', wait: 2000 },
      { shot: 'entretien-question' },
      { click: '1 200', wait: 1200 },
      { shot: 'entretien-reponse' },
      { goto: '/entretien', wait: 2500 },
      { click: 'Entretien blanc', wait: 4500 },
      { shot: 'entretien-blanc' },
    ],
  },
  {
    name: 'carriere',
    steps: [{ goto: '/profil', wait: 3500 }, { shot: 'carriere' }, { wheel: 520, wait: 1000 }, { shot: 'carriere-2' }, { goto: '/vestiaire', wait: 3000 }, { shot: 'vestiaire' }],
  },
  {
    name: 'sombre',
    scheme: 'dark',
    steps: [
      { goto: '/', wait: 3500 },
      { shot: 'home-dark' },
      { goto: '/marches/btc', wait: 4500 },
      { shot: 'btc-dark' },
      { goto: '/marches/options/btc', wait: 4000 },
      { shot: 'options-chaine-dark' },
    ],
  },
].filter((fl) => !only.length || only.includes(fl.name));

for (const fl of FLOWS) {
  const page = await makePage(fl.scheme ?? 'light');
  for (const st of fl.steps) {
    try {
      if (st.goto) await page.goto(`${URL0}${st.goto}`, { waitUntil: 'networkidle', timeout: 30000 });
      if (st.click) await page.getByText(st.click, { exact: true }).last().click({ timeout: 5000 });
      if (st.label) await page.getByLabel(st.label).last().click({ timeout: 5000 });
      if (st.tap) await page.mouse.click(...st.tap);
      if (st.wheel) {
        await page.mouse.move(195, 450);
        await page.mouse.wheel(0, st.wheel);
      }
      if (st.wait) await page.waitForTimeout(st.wait);
      if (st.shot) {
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(RAW, `${st.shot}.png`) });
        console.log(fl.name, '→', st.shot);
      }
    } catch (e) {
      console.log(fl.name, 'étape ratée', JSON.stringify(st), String(e).split('\n')[0].slice(0, 120));
    }
  }
  await page.context().close();
}
await browser.close();
server.close();
