/**
 * Bande-son de la pub Gen Z : pop-trap à 120 BPM, en fa dièse mineur (i – VI – III – VII).
 * Accroche tendue (tic-tac, montée), drop à 2 s, mélodie pincée avec écho, souffles sur les coupes,
 * coupure d'un temps avant « la vérité tombe », impact, dernier coup sur le logo. Déterministe.
 * Usage : npx tsx scripts/make-audio-genz.ts → public/audio/base-point-genz.wav
 */
import fs from 'node:fs';
import { AD, BEAT } from '../src/ad/timeline';

const SR = 48000;
const DUR = AD.end + 0.5;
const N = Math.ceil(DUR * SR);
const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const drums = bus();
const bass = bus();
const lead = bus();
const pad = bus();
const fx = bus();
const send = new Float32Array(N); // départ réverbération (mono)
let seed = 11;
const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const noise = () => rand() * 2 - 1;
const TAU = 2 * Math.PI;

const DROP = AD.normal;
const STOP = AD.verite - BEAT; // un temps de silence avant l'impact
const OUTRO_END = AD.end - 1.0;
const bar = (t: number) => Math.floor((t - DROP) / (4 * BEAT));
const inStop = (t: number) => t >= STOP && t < AD.verite;

// Accords (fa# mineur) : F#m – D – A – E, une mesure chacun. Fondamentales de la 808 et notes du pad.
const ROOTS = [46.25, 73.42, 55.0, 82.41];
const PADS = [
  [185.0, 220.0, 277.18, 369.99],
  [146.83, 185.0, 220.0, 293.66],
  [220.0, 277.18, 329.63, 440.0],
  [164.81, 207.65, 246.94, 329.63],
];
const chord = (t: number) => ((bar(t) % 4) + 4) % 4;

const add = (b: { L: Float32Array; R: Float32Array }, i: number, v: number, pan = 0) => {
  if (i < 0 || i >= N) return;
  b.L[i] += v * (1 - pan);
  b.R[i] += v * (1 + pan);
};

// ------------------------------------------------------------------ percussions

const kickTimes: number[] = [];
const kick = (t0: number, gain = 1) => {
  kickTimes.push(t0);
  const s0 = Math.round(t0 * SR);
  let ph = 0;
  for (let i = 0; i < 0.45 * SR; i++) {
    const t = i / SR;
    const f = 48 + 110 * Math.exp(-t * 32);
    ph += (TAU * f) / SR;
    const env = Math.exp(-t * 7) * Math.min(1, t * 2000);
    const click = Math.exp(-t * 400) * noise() * 0.3;
    add(drums, s0 + i, Math.tanh((Math.sin(ph) * 1.6 + click) * env) * 0.9 * gain);
  }
};

const clap = (t0: number, gain = 1) => {
  const s0 = Math.round(t0 * SR);
  let bp1 = 0;
  let bp2 = 0;
  for (let i = 0; i < 0.35 * SR; i++) {
    const t = i / SR;
    // Trois petits éclats puis la queue.
    const burst = [0, 0.011, 0.022].reduce((a, d) => a + (t >= d ? Math.exp(-(t - d) * 180) : 0), 0);
    const env = burst * 0.6 + Math.exp(-t * 16) * 0.5;
    const x = noise();
    bp1 += (x - bp1) * 0.35;
    bp2 += (bp1 - bp2) * 0.35;
    const v = (bp1 - bp2) * env * 1.6 * gain;
    add(drums, s0 + i, v, 0.05);
    send[s0 + i] += v * 0.35;
  }
};

const hat = (t0: number, gain = 1, open = false, pan = 0.2) => {
  const s0 = Math.round(t0 * SR);
  let lp = 0;
  const len = open ? 0.18 : 0.045;
  for (let i = 0; i < len * SR; i++) {
    const t = i / SR;
    const x = noise();
    lp += (x - lp) * 0.6;
    const hp = x - lp;
    add(drums, s0 + i, hp * Math.exp(-t * (open ? 18 : 90)) * 0.28 * gain, pan);
  }
};

const tick = (t0: number, gain = 1, f = 2400) => {
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < 0.03 * SR; i++) {
    const t = i / SR;
    add(fx, s0 + i, Math.sin(TAU * f * t) * Math.exp(-t * 200) * 0.9 * gain, f > 2000 ? 0.3 : -0.3);
  }
};

// ------------------------------------------------------------------ 808, pad, mélodie

const bass808 = (t0: number, f: number, len: number, gain = 1) => {
  const s0 = Math.round(t0 * SR);
  let ph = 0;
  for (let i = 0; i < len * SR; i++) {
    const t = i / SR;
    const ff = f * (1 + 0.5 * Math.exp(-t * 40));
    ph += (TAU * ff) / SR;
    const env = Math.min(1, t * 400) * Math.exp(-t * 1.6) * Math.min(1, (len - t) * 30);
    // Saturation : fait apparaître les harmoniques audibles sur un haut-parleur de téléphone.
    add(bass, s0 + i, Math.tanh(Math.sin(ph) * 2.2) * env * 0.42 * gain);
  }
};

const saw = (ph: number, harmonics: number) => {
  let v = 0;
  for (let k = 1; k <= harmonics; k++) v += Math.sin(ph * k) / k;
  return v * 0.6;
};

const pluck = (t0: number, f: number, gain: number, pan: number) => {
  const s0 = Math.round(t0 * SR);
  let lp = 0;
  for (let i = 0; i < 0.6 * SR && s0 + i < N; i++) {
    const t = i / SR;
    const x = saw(TAU * f * t, 9) + 0.4 * Math.sin(TAU * f * 2 * t);
    const cutoff = 600 + 5200 * Math.exp(-t * 14);
    lp += (x - lp) * (1 - Math.exp((-TAU * cutoff) / SR));
    const env = Math.min(1, t * 1500) * Math.exp(-t * 6.5);
    const v = lp * env * gain;
    add(lead, s0 + i, v, pan);
    send[s0 + i] += v * 0.25;
  }
};

// ------------------------------------------------------------------ effets

const whoosh = (tEnd: number, len = 0.45, gain = 1) => {
  const s0 = Math.round((tEnd - len) * SR);
  let lp = 0;
  for (let i = 0; i < len * SR; i++) {
    const t = i / SR;
    const p = t / len;
    const cutoff = 300 + 7000 * p * p;
    lp += (noise() - lp) * (1 - Math.exp((-TAU * cutoff) / SR));
    const env = Math.sin(Math.PI * Math.min(1, p * 1.15)) ** 2;
    add(fx, s0 + i, lp * env * 0.55 * gain, (p - 0.5) * 0.8);
  }
};

const riser = (t0: number, t1: number, gain = 1) => {
  const s0 = Math.round(t0 * SR);
  const len = t1 - t0;
  let lp = 0;
  let ph = 0;
  for (let i = 0; i < len * SR; i++) {
    const t = i / SR;
    const p = t / len;
    const cutoff = 200 + 9000 * p ** 2.2;
    lp += (noise() - lp) * (1 - Math.exp((-TAU * cutoff) / SR));
    ph += (TAU * (220 + 660 * p ** 2)) / SR;
    const env = p ** 1.6;
    add(fx, s0 + i, (lp * 0.5 + Math.sin(ph) * 0.12) * env * gain);
  }
};

const impact = (t0: number, gain = 1) => {
  const s0 = Math.round(t0 * SR);
  let ph = 0;
  let lp = 0;
  for (let i = 0; i < 2.2 * SR && s0 + i < N; i++) {
    const t = i / SR;
    const f = 34 + 90 * Math.exp(-t * 9);
    ph += (TAU * f) / SR;
    const sub = Math.tanh(Math.sin(ph) * 2.5) * Math.exp(-t * 2.2) * 0.75;
    const x = noise();
    lp += (x - lp) * 0.25;
    const crash = (x - lp * 0.6) * Math.exp(-t * 3.2) * 0.22;
    add(fx, s0 + i, (sub + crash) * gain);
    send[s0 + i] += crash * 0.5 * gain;
  }
};

const reverseCymbal = (tEnd: number, len = 1.0, gain = 1) => {
  const s0 = Math.round((tEnd - len) * SR);
  let lp = 0;
  for (let i = 0; i < len * SR; i++) {
    const p = i / (len * SR);
    const x = noise();
    lp += (x - lp) * 0.3;
    add(fx, s0 + i, (x - lp) * p ** 3 * 0.35 * gain, 0);
  }
};

// ------------------------------------------------------------------ arrangement

// Accroche : tic-tac d'horloge (les marchés n'attendent pas), montée, cymbale inversée vers le drop.
for (let t = 0; t < DROP - 0.01; t += BEAT / 2) tick(t, t % BEAT === 0 ? 1 : 0.5, t % BEAT === 0 ? 2600 : 1800);
riser(0.6, DROP, 0.9);
reverseCymbal(DROP, 1.2, 1);

// Pad : présent dès l'accroche (filtré), pompé par la grosse caisse ensuite.
for (let i = 0; i < N; i++) {
  const t = i / SR;
  if (t > OUTRO_END + 0.9) break;
  const c = PADS[t < DROP ? 0 : chord(t)];
  let l = 0;
  let r = 0;
  c.forEach((f, k) => {
    l += saw(TAU * f * 1.004 * t + k, 5);
    r += saw(TAU * f * 0.996 * t + k * 1.7, 5);
  });
  const g = t < DROP ? 0.03 + 0.015 * (t / DROP) : inStop(t) ? 0.004 : 0.03;
  pad.L[i] = l * g;
  pad.R[i] = r * g;
}
// Filtre passe-bas du pad (plus sombre pendant l'accroche).
for (const ch of [pad.L, pad.R]) {
  let y = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const fc = t < DROP ? 500 + 2500 * (t / DROP) ** 2 : 2600;
    y += (ch[i] - y) * (1 - Math.exp((-TAU * fc) / SR));
    ch[i] = y;
  }
}

// Mélodie : motif de deux mesures en croches (pentatonique de fa# mineur), 0 = silence.
const MOTIF = [
  554.37, 0, 659.26, 554.37, 0, 493.88, 440.0, 0,
  369.99, 0, 440.0, 493.88, 0, 554.37, 493.88, 440.0,
];
const MOTIF_B = [
  739.99, 0, 659.26, 554.37, 0, 659.26, 554.37, 493.88,
  440.0, 0, 493.88, 554.37, 0, 440.0, 369.99, 0,
];

for (let k = 0; ; k++) {
  const t = DROP + k * (BEAT / 2);
  if (t >= OUTRO_END) break;
  if (inStop(t)) continue;
  const step = k % 8;
  const b = bar(t);
  // Grosse caisse, 808, clap, charleston.
  if ([0, 3, 5].includes(step)) {
    kick(t, step === 0 ? 1 : 0.85);
    const len = step === 5 ? 3 * (BEAT / 2) : step === 0 ? 3 * (BEAT / 2) : 2 * (BEAT / 2);
    bass808(t, ROOTS[chord(t)], len, step === 0 ? 1 : 0.8);
  }
  if (step === 2 || step === 6) clap(t, 0.9);
  const lastBeatOfPair = b % 2 === 1 && step >= 6;
  if (lastBeatOfPair) {
    // Roulement en doubles-croches puis triolets.
    for (let j = 0; j < (step === 7 ? 3 : 2); j++) hat(t + (j * BEAT) / (step === 7 ? 6 : 4), 0.7 + j * 0.1, false, 0.25);
  } else {
    hat(t, step % 2 ? 0.6 : 0.9, step === 7, 0.2);
  }
  // Mélodie (pas pendant la fin : on laisse la place au slogan).
  if (t < AD.fin || t >= AD.fin + 4 * BEAT) {
    const m = (b >= 4 && b % 4 >= 2 ? MOTIF_B : MOTIF)[(k % 16 + 16) % 16];
    if (m) {
      pluck(t, m, 0.16, step % 2 ? 0.25 : -0.25);
      // Écho à la croche pointée, de l'autre côté.
      pluck(t + 0.75 * BEAT, m, 0.06, step % 2 ? -0.4 : 0.4);
    }
  }
}

// Coupes : souffle juste avant chaque nouvelle scène.
for (const t of [AD.lecons, AD.trading, AD.simu, AD.scenarios, AD.carriere]) whoosh(t, 0.42, 0.9);
// Drop, impact de la révélation, logo.
impact(DROP, 1);
reverseCymbal(AD.verite, BEAT, 1.2);
impact(AD.verite, 1.1);
impact(AD.fin, 0.9);
// Dernier accord tenu à la fin.
kick(OUTRO_END, 1);
bass808(OUTRO_END, ROOTS[0], 1.2, 1);
PADS[0].forEach((f, k) => pluck(OUTRO_END + k * 0.03, f * 2, 0.1, (k - 1.5) * 0.2));

// Pompage du pad par la grosse caisse (effet « sidechain »).
kickTimes.sort((a, b) => a - b);
{
  let j = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    while (j + 1 < kickTimes.length && kickTimes[j + 1] <= t) j++;
    const since = kickTimes[j] !== undefined && kickTimes[j] <= t ? t - kickTimes[j] : 9;
    const g = 1 - 0.7 * Math.exp(-since / 0.11);
    pad.L[i] *= g;
    pad.R[i] *= g;
  }
}

// Réverbération simple (Schroeder) sur le départ.
const reverb = (x: Float32Array, spread: number) => {
  const out = new Float32Array(N);
  const combs = [1557, 1617, 1491, 1422].map((d) => Math.round((d + spread) * (SR / 44100)));
  for (const d of combs) {
    const buf = new Float32Array(d);
    let p = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[p];
      buf[p] = x[i] + y * 0.8;
      out[i] += y * 0.25;
      p = (p + 1) % d;
    }
  }
  for (const d of [225, 556].map((v) => Math.round((v + spread / 3) * (SR / 44100)))) {
    const buf = new Float32Array(d);
    let p = 0;
    for (let i = 0; i < N; i++) {
      const b = buf[p];
      const y = -out[i] * 0.5 + b;
      buf[p] = out[i] + b * 0.5;
      out[i] = y;
      p = (p + 1) % d;
    }
  }
  return out;
};
const revL = reverb(send, 0);
const revR = reverb(send, 23);

// Mixage.
const L = new Float32Array(N);
const R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, (DUR - t) / 1.2);
  L[i] = (drums.L[i] * 1.0 + bass.L[i] * 0.9 + lead.L[i] + pad.L[i] + fx.L[i] + revL[i] * 0.5) * fade;
  R[i] = (drums.R[i] * 1.0 + bass.R[i] * 0.9 + lead.R[i] + pad.R[i] + fx.R[i] + revR[i] * 0.5) * fade;
}

let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const norm = 1.1 / peak; // léger écrêtage doux (tanh) pour une musique « forte » comme sur le fil
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.tanh(L[i] * norm) * 0.89 * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[i] * norm) * 0.89 * 32767), 46 + i * 4);
}
fs.mkdirSync('public/audio', { recursive: true });
fs.writeFileSync('public/audio/base-point-genz.wav', buf);
console.log(`→ public/audio/base-point-genz.wav (${DUR.toFixed(1)} s)`);
