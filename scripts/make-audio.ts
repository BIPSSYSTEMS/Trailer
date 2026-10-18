/**
 * Synthèse de la bande-son du trailer (piste provisoire à 128 BPM + SFX), entièrement déterministe.
 * Usage : npx tsx scripts/make-audio.ts  → public/audio/bips-trailer.wav (48 kHz, stéréo, 16 bits)
 *
 * Quand la vraie piste arrivera : la poser dans public/audio/, régler BPM/OFFSET dans src/timing.ts
 * et passer `MUSIC` à false ci-dessous pour ne garder que les SFX.
 */
import fs from 'node:fs';
import path from 'node:path';
import { CUES, END_BEAT, SECTIONS, SILENCE, Sfx } from '../src/audio/cues';
import { BPM } from '../src/timing';

const MUSIC = true;
const SR = 48000;
const SPB = 60 / BPM; // secondes par temps
const N = Math.ceil(END_BEAT * SPB * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const send = new Float32Array(N); // bus de réverbération
const duck = new Float32Array(N).fill(1); // sidechain des nappes et de la basse

let seed = 12345;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;
const at = (beat: number) => Math.round(beat * SPB * SR);
const add = (i: number, v: number, pan = 0, rev = 0) => {
  if (i < 0 || i >= N) return;
  L[i] += v * (1 - Math.max(0, pan));
  R[i] += v * (1 + Math.min(0, pan));
  send[i] += v * rev;
};

// ------------------------------------------------------------------ instruments

const kick = (b: number, g = 1) => {
  const s = at(b);
  const len = 0.45 * SR;
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = 45 + 110 * Math.exp(-t * 28);
    ph += (2 * Math.PI * f) / SR;
    const env = Math.exp(-t * 7);
    add(s + i, Math.tanh(Math.sin(ph) * 2.2) * env * 0.85 * g + (i < 120 ? noise() * 0.25 * g : 0));
  }
  for (let i = 0; i < 0.3 * SR; i++) duck[s + i] = Math.min(duck[s + i] ?? 1, 0.35 + 0.65 * Math.min(1, i / (0.3 * SR)));
};

const hat = (b: number, g = 0.22, open = false) => {
  const s = at(b);
  let prev = 0;
  for (let i = 0; i < (open ? 0.22 : 0.05) * SR; i++) {
    const n = noise();
    const hp = n - prev;
    prev = n;
    add(s + i, hp * Math.exp((-i / SR) * (open ? 14 : 70)) * g, (rand() - 0.5) * 0.4);
  }
};

const clap = (b: number, g = 0.5) => {
  const s = at(b);
  for (const off of [0, 0.011, 0.022]) {
    let lp = 0;
    for (let i = 0; i < 0.18 * SR; i++) {
      const t = i / SR;
      lp += (noise() - lp) * 0.35;
      add(s + Math.round(off * SR) + i, lp * Math.exp(-t * (off === 0.022 ? 18 : 60)) * g, 0, 0.25);
    }
  }
};

const NOTES: Record<string, number> = { A: 55, F: 43.65, C: 65.41, G: 49 };
const PROG = ['A', 'F', 'C', 'G'];
const chordOf = (b: number) => PROG[Math.floor(b / 4) % 4];

const bass = (b: number) => {
  const root = NOTES[chordOf(b)];
  const s = at(b);
  const len = Math.round(SPB * 0.5 * SR);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * root) / SR;
    const env = Math.min(1, t * 200) * Math.exp(-t * 3);
    const v = (Math.sin(ph) + 0.25 * Math.sin(ph * 2)) * env * 0.42;
    L[s + i] += v;
    R[s + i] += v;
  }
};

/** Nappe : accord de dents de scie désaccordées, filtrées, avec pompe sidechain. */
const pad = (from: number, to: number, level: number) => {
  const s0 = at(from);
  const s1 = Math.min(N, at(to));
  const voices = [1, 1.5, 2, 2.5, 3];
  const phases = voices.map(() => [rand(), rand()]);
  let lpL = 0;
  let lpR = 0;
  for (let i = s0; i < s1; i++) {
    const b = i / SR / SPB;
    const root = NOTES[chordOf(b)] * 4;
    const minor = chordOf(b) === 'A';
    let vl = 0;
    let vr = 0;
    voices.forEach((m, k) => {
      const mult = k === 1 ? 1.5 : k === 3 ? (minor ? 2.378 : 2.52) : m;
      const f = root * mult;
      phases[k][0] = (phases[k][0] + (f * 1.003) / SR) % 1;
      phases[k][1] = (phases[k][1] + (f * 0.997) / SR) % 1;
      vl += phases[k][0] * 2 - 1;
      vr += phases[k][1] * 2 - 1;
    });
    lpL += (vl - lpL) * 0.04;
    lpR += (vr - lpR) * 0.04;
    const fade = Math.min(1, (i - s0) / (0.3 * SR), (s1 - i) / (0.05 * SR));
    const g = level * 0.05 * fade * duck[i];
    L[i] += lpL * g;
    R[i] += lpR * g;
    send[i] += (lpL + lpR) * g * 0.15;
  }
};

// ------------------------------------------------------------------ effets sonores

const sine = (s: number, len: number, f: (t: number) => number, env: (t: number) => number, g: number, pan = 0, rev = 0.2, square = false) => {
  let ph = 0;
  for (let i = 0; i < len * SR; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * f(t)) / SR;
    const v = square ? Math.tanh(Math.sin(ph) * 4) : Math.sin(ph);
    add(s + i, v * env(t) * g, pan, rev);
  }
};

const noiseSweep = (s: number, len: number, f0: number, f1: number, env: (t: number) => number, g: number, rev = 0.3) => {
  // Filtre passe-bande à variables d'état dont la fréquence balaie de f0 à f1.
  let low = 0;
  let band = 0;
  for (let i = 0; i < len * SR; i++) {
    const t = i / SR;
    const fc = f0 * Math.pow(f1 / f0, t / len);
    const F = 2 * Math.sin((Math.PI * fc) / SR);
    const high = noise() - low - 0.6 * band;
    band += F * high;
    low += F * band;
    add(s + i, band * env(t) * g, Math.sin(t * 6) * 0.5, rev);
  }
};

const play = (c: Sfx) => {
  const s = at(c.b);
  switch (c.t) {
    case 'bip':
      sine(s, 0.09, () => c.pitch ?? 1000, (t) => Math.min(1, t * 400) * (t < 0.07 ? 1 : Math.max(0, 1 - (t - 0.07) * 50)), (c.gain ?? 0.6) * 0.35, 0, 0.35, true);
      break;
    case 'heart':
      sine(s, 0.25, (t) => 60 - t * 40, (t) => Math.exp(-t * 18), 0.9, 0, 0.1);
      sine(s + Math.round(0.16 * SR), 0.25, (t) => 55 - t * 30, (t) => Math.exp(-t * 20), 0.6, 0, 0.1);
      break;
    case 'impact': {
      const k = c.size ?? 1;
      sine(s, 1.6 * k + 0.3, (t) => 38 + 70 * Math.exp(-t * 12), (t) => Math.exp(-t * (3.2 / k)), 0.95 * Math.min(1.2, k), 0, 0.5);
      noiseSweep(s, 0.6 + 0.6 * k, 5000, 200, (t) => Math.exp(-t * 6), 0.9 * k, 0.8);
      for (let i = 0; i < 0.5 * SR * k; i++) duck[s + i] = Math.min(duck[s + i] ?? 1, 0.2 + 0.8 * (i / (0.5 * SR * k)));
      break;
    }
    case 'whoosh': {
      const len = (c.len ?? 0.5) * SPB * 1.4;
      noiseSweep(s - Math.round(len * SR * 0.6), len, c.up === false ? 3000 : 300, c.up === false ? 300 : 4000, (t) => Math.sin((Math.PI * t) / len) ** 2, 1.1, 0.4);
      break;
    }
    case 'riser': {
      const len = c.len * SPB;
      noiseSweep(s, len, 200, 8000, (t) => (t / len) ** 2, 0.9, 0.3);
      sine(s, len, (t) => 200 * Math.pow(8, t / len), (t) => (t / len) ** 2 * 0.5, 0.25, 0, 0.3);
      break;
    }
    case 'pop':
      sine(s, 0.12, (t) => (c.pitch ?? 500) * (1 + t * 12), (t) => Math.exp(-t * 35), 0.55, (rand() - 0.5) * 0.6, 0.15);
      break;
    case 'chime':
      for (const [m, g] of [[1, 0.35], [2, 0.18], [3, 0.1], [4.2, 0.06]] as const)
        sine(s, 1.6, () => (c.pitch ?? 880) * m, (t) => Math.min(1, t * 300) * Math.exp(-t * 3.5), g, 0, 0.6);
      break;
    case 'tick':
      sine(s, 0.02, () => 3200, (t) => Math.exp(-t * 300), 0.4, 0.2, 0.05, true);
      break;
    case 'click':
      sine(s, 0.03, () => 1800, (t) => Math.exp(-t * 200), 0.6, 0, 0.1, true);
      sine(s + Math.round(0.035 * SR), 0.03, () => 2400, (t) => Math.exp(-t * 200), 0.5, 0, 0.1, true);
      break;
    case 'thud':
      sine(s, 0.35, (t) => 90 * Math.exp(-t * 6) + 40, (t) => Math.exp(-t * 14), 0.8, 0, 0.2);
      noiseSweep(s, 0.12, 2000, 300, (t) => Math.exp(-t * 30), 0.6, 0.1);
      break;
    case 'coins':
      for (let k = 0; k < 14; k++) {
        const d = Math.round((k * 0.045 + rand() * 0.03) * SR);
        const p = 2600 + rand() * 2400;
        sine(s + d, 0.25, () => p, (t) => Math.exp(-t * 22), 0.12, (rand() - 0.5) * 1.2, 0.3);
        sine(s + d, 0.25, () => p * 2.76, (t) => Math.exp(-t * 30), 0.05, 0, 0.3);
      }
      break;
  }
};

// ------------------------------------------------------------------ arrangement

if (MUSIC) {
  for (const sec of SECTIONS) {
    for (let b = sec.from; b < sec.to - 1e-9; b += 0.25) {
      const onBeat = Math.abs(b - Math.round(b)) < 1e-6;
      const bi = Math.round(b);
      if (onBeat) {
        if (sec.kick === 'four') kick(b);
        if (sec.kick === 'half' && bi % 2 === 0) kick(b);
        if (sec.kick === 'sparse' && bi % 2 === 0) kick(b, 0.8);
        if (sec.clap && bi % 2 === 1) clap(b);
      }
      const frac = b - Math.floor(b);
      if (sec.hats === 'off' && Math.abs(frac - 0.5) < 1e-6) hat(b, 0.2, bi % 4 === 3);
      if (sec.hats === 'sixteenth') hat(b, Math.abs(frac - 0.5) < 1e-6 ? 0.2 : 0.1);
      if (sec.bass && (Math.abs(frac - 0.5) < 1e-6 || (onBeat && sec.kick !== 'four'))) bass(b);
    }
    if (sec.pad > 0) pad(sec.from, sec.to, sec.pad);
  }
  // Roulement de clap avant le drop final.
  for (let b = SILENCE[0] - 1; b < SILENCE[0] - 1e-9; b += 0.125) clap(b, 0.25 + (b - SILENCE[0] + 1) * 0.4);
  // Accord final tenu après le boom.
  pad(SILENCE[1], END_BEAT, 1.4);
}
CUES.forEach(play);

// ------------------------------------------------------------------ réverbération (Schroeder) sur le bus d'envoi

const comb = (inp: Float32Array, delay: number, fb: number) => {
  const out = new Float32Array(N);
  const d = Math.round(delay * SR);
  for (let i = 0; i < N; i++) out[i] = inp[i] + (i >= d ? out[i - d] * fb : 0);
  return out;
};
const allpass = (inp: Float32Array, delay: number, g: number) => {
  const out = new Float32Array(N);
  const d = Math.round(delay * SR);
  for (let i = 0; i < N; i++) out[i] = -g * inp[i] + (i >= d ? inp[i - d] + g * out[i - d] : 0);
  return out;
};
const revL = new Float32Array(N);
const revR = new Float32Array(N);
[0.0297, 0.0371, 0.0411, 0.0437].forEach((d, k) => {
  const c = comb(send, d, 0.82);
  for (let i = 0; i < N; i++) (k % 2 ? revR : revL)[i] += c[i] * 0.25;
});
const wetL = allpass(allpass(revL, 0.005, 0.7), 0.0017, 0.7);
const wetR = allpass(allpass(revR, 0.0051, 0.7), 0.0019, 0.7);

// ------------------------------------------------------------------ mixage, silence du drop, normalisation

const s0 = at(SILENCE[0]);
const s1 = at(SILENCE[1]);
let peak = 0;
for (let i = 0; i < N; i++) {
  let l = L[i] + wetL[i] * 0.35;
  let r = R[i] + wetR[i] * 0.35;
  if (i >= s0 && i < s1) {
    // Silence net (avec 8 ms de fondu pour éviter le clic).
    const k = Math.min(1, (i - s0) / (0.008 * SR));
    l *= 1 - k;
    r *= 1 - k;
  }
  L[i] = Math.tanh(l * 0.9);
  R[i] = Math.tanh(r * 0.9);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.95 / peak;
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
  buf.writeInt16LE(Math.round(L[i] * norm * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(R[i] * norm * 32767), 46 + i * 4);
}
const out = path.join(process.cwd(), 'public/audio/bips-trailer.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log(out, (N / SR).toFixed(2) + ' s');
