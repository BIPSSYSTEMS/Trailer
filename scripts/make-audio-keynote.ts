/**
 * Bande-son de la vidéo keynote Base Point : nappes, notes de piano synthétique espacées, souffle doux
 * à chaque changement de section. Pas de batterie. Déterministe.
 * Usage : npx tsx scripts/make-audio-keynote.ts → public/audio/base-point-keynote.wav
 */
import fs from 'node:fs';
import { KSECTIONS as ISECTIONS, KSTART as ISTART, KTOTAL as ITOTAL } from '../src/keynote/timeline';

const SR = 48000;
const DUR = ITOTAL + 1.5;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// Progression lente (une mesure = 4 s) : Am7 – Fmaj7 – Cmaj7 – G6, voix en Hz.
const CHORDS = [
  [110, 164.81, 196, 261.63, 329.63],
  [87.31, 130.81, 174.61, 220, 329.63],
  [65.41, 130.81, 164.81, 246.94, 293.66],
  [98, 146.83, 196, 246.94, 329.63],
];
const BAR = 4;
const chordAt = (t: number) => CHORDS[Math.floor(t / BAR) % CHORDS.length];

// Nappe : sinus désaccordés filtrés, fondus d'accord.
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const c = chordAt(t);
  const pos = (t % BAR) / BAR;
  const env = Math.min(1, pos * 6, (1 - pos) * 6 + 0.35);
  let l = 0;
  let r = 0;
  c.forEach((f, k) => {
    l += Math.sin(2 * Math.PI * f * 1.002 * t + k) * (k === 0 ? 0.5 : 0.22);
    r += Math.sin(2 * Math.PI * f * 0.998 * t + k * 2) * (k === 0 ? 0.5 : 0.22);
  });
  const fadeIn = Math.min(1, t / 3);
  const fadeOut = Math.min(1, (DUR - t) / 3);
  const g = 0.06 * env * fadeIn * fadeOut * (1 + 0.15 * Math.sin(t * 0.4));
  L[i] += l * g;
  R[i] += r * g;
}

// Notes de piano : une note de l'accord tous les deux temps (tempo 60), enveloppe percussive.
const note = (t0: number, f: number, gain: number, pan: number) => {
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < 2.5 * SR && s0 + i < N; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 400) * Math.exp(-t * 2.2);
    const v = (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 4) + 0.12 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 6)) * env * gain;
    L[s0 + i] += v * (1 - pan);
    R[s0 + i] += v * (1 + pan);
  }
};
for (let t = 2; t < DUR - 4; t += 2) {
  const c = chordAt(t);
  const f = c[2 + Math.floor(rand() * 3)] * 2;
  note(t, f, 0.05, (rand() - 0.5) * 0.6);
}

// Arpège pincé, doux, en croches à 96 BPM, pendant les sections « fonctionnalité » (après la vue d'ensemble).
const pluck = (t0: number, f: number, gain: number, pan: number) => {
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < 0.9 * SR && s0 + i < N; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 900) * Math.exp(-t * 7);
    const v = (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 10)) * env * gain;
    L[s0 + i] += v * (1 - pan);
    R[s0 + i] += v * (1 + pan);
  }
};
const ARP_FROM = ISTART.parcours;
const ARP_TO = ISTART.sources + 1;
const EIGHTH = 60 / 96 / 2;
for (let t = ARP_FROM, n = 0; t < ARP_TO; t += EIGHTH, n++) {
  const c = chordAt(t);
  const f = c[[1, 2, 3, 4, 3, 2][n % 6]] * 2;
  const fade = Math.min(1, (t - ARP_FROM) / 3, (ARP_TO - t) / 2);
  pluck(t, f, 0.028 * fade, n % 2 ? 0.25 : -0.25);
}

// Souffle doux + note grave à chaque section.
for (const x of ISECTIONS) {
  const t0 = ISTART[x.id];
  if (t0 > 0) {
    let lp = 0;
    const s0 = Math.round((t0 - 0.8) * SR);
    for (let i = 0; i < 1.6 * SR; i++) {
      const t = i / SR;
      lp += ((rand() * 2 - 1) - lp) * 0.02;
      const env = Math.sin((Math.PI * t) / 1.6) ** 2;
      L[s0 + i] += lp * env * 0.5;
      R[s0 + i] += lp * env * 0.5;
    }
  }
  note(t0 + 0.05, chordAt(t0)[0] / 2, 0.16, 0);
}

let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const norm = 0.85 / peak;
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
  buf.writeInt16LE(Math.round(Math.tanh(L[i] * norm) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[i] * norm) * 32767), 46 + i * 4);
}
fs.writeFileSync('public/audio/base-point-keynote.wav', buf);
console.log('public/audio/base-point-keynote.wav', DUR.toFixed(1) + ' s');
