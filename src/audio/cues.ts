/**
 * Partition des sons du trailer, en temps globaux (calés sur les scènes via SCENE_BEAT_START).
 * Lue par scripts/make-audio.ts qui synthétise public/audio/bips-trailer.wav.
 */
import { FINALE, SCENE_BEAT_START as S, TOTAL_BEATS } from '../timing';

export type Sfx =
  | { t: 'bip'; b: number; pitch?: number; gain?: number }
  | { t: 'impact'; b: number; size?: number }
  | { t: 'whoosh'; b: number; len?: number; up?: boolean }
  | { t: 'riser'; b: number; len: number }
  | { t: 'pop'; b: number; pitch?: number }
  | { t: 'chime'; b: number; pitch?: number }
  | { t: 'tick'; b: number }
  | { t: 'click'; b: number }
  | { t: 'thud'; b: number }
  | { t: 'coins'; b: number }
  | { t: 'heart'; b: number };

const range = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let x = from; x < to - 1e-9; x += step) out.push(x);
  return out;
};

export const SILENCE: [number, number] = [S.finale + FINALE.dropBeats, S.finale + FINALE.dropBeats + FINALE.silenceBeats];
export const END_BEAT = TOTAL_BEATS + 2.2;

/** Sections musicales : groove plein, demi-temps, tension, drop… */
export const SECTIONS: { from: number; to: number; kick: 'none' | 'four' | 'half' | 'sparse'; hats: 'none' | 'off' | 'sixteenth'; clap: boolean; bass: boolean; pad: number }[] = [
  { from: 0, to: 2, kick: 'none', hats: 'none', clap: false, bass: false, pad: 0.3 },
  { from: 2, to: S.hook + 4, kick: 'sparse', hats: 'none', clap: false, bass: true, pad: 0.5 },
  { from: S.hook + 4, to: S.dialogues, kick: 'four', hats: 'off', clap: true, bass: true, pad: 0.7 },
  { from: S.dialogues, to: S.scenarios, kick: 'half', hats: 'off', clap: false, bass: true, pad: 0.9 },
  { from: S.scenarios, to: S.scenarios + 5.5, kick: 'sparse', hats: 'sixteenth', clap: false, bass: false, pad: 1 },
  { from: S.scenarios + 5.5, to: S.finale, kick: 'four', hats: 'off', clap: true, bass: true, pad: 0.7 },
  { from: S.finale, to: SILENCE[0], kick: 'four', hats: 'sixteenth', clap: true, bass: true, pad: 0.4 },
  { from: SILENCE[1], to: TOTAL_BEATS, kick: 'four', hats: 'off', clap: true, bass: true, pad: 1 },
];

export const CUES: Sfx[] = [
  // 1. Hook
  { t: 'bip', b: 0, pitch: 1000, gain: 0.9 },
  { t: 'heart', b: 0.6 },
  { t: 'bip', b: 1, pitch: 1000, gain: 0.7 },
  { t: 'heart', b: 1.6 },
  { t: 'whoosh', b: S.hook + 1.5, len: 0.6, up: true },
  { t: 'impact', b: S.hook + 2, size: 0.5 },
  { t: 'riser', b: S.hook + 3, len: 1 },
  { t: 'impact', b: S.hook + 4, size: 1 },
  { t: 'coins', b: S.hook + 4.1 },
  { t: 'whoosh', b: S.hook + 5.25, len: 0.75 },
  // 2. Logo
  { t: 'whoosh', b: S.logo, len: 1, up: false },
  { t: 'riser', b: S.logo + 4, len: 1.5 },
  { t: 'impact', b: S.logo + 5.5, size: 1.1 },
  { t: 'chime', b: S.logo + 5.55, pitch: 880 },
  { t: 'chime', b: S.logo + 6, pitch: 1320 },
  { t: 'whoosh', b: S.logo + 7.1, len: 0.9 },
  // 3. Parcours : un bip par bulle, de plus en plus aigu
  ...range(1, 8, 1).map((i) => ({ t: 'bip' as const, b: S.path + i, pitch: 660 * Math.pow(2, (i - 1) / 7), gain: 0.6 })),
  ...range(1.5, 8.5, 1).map((i) => ({ t: 'pop' as const, b: S.path + i, pitch: 300 + i * 40 })),
  { t: 'impact', b: S.path + 8, size: 0.9 },
  ...[8.5, 9, 9.25].map((h) => ({ t: 'thud' as const, b: S.path + h })),
  { t: 'riser', b: S.path + 9.5, len: 1 },
  { t: 'chime', b: S.path + 10.5, pitch: 1046 },
  { t: 'coins', b: S.path + 10.5 },
  { t: 'whoosh', b: S.path + 11.2, len: 0.8 },
  // 4. Carrière
  ...[1, 2, 3, 4].flatMap((i) => [
    { t: 'whoosh' as const, b: S.career + i - 0.18, len: 0.3, up: true },
    { t: 'impact' as const, b: S.career + i, size: 0.55 },
  ]),
  { t: 'chime', b: S.career + 4.05, pitch: 1320 },
  { t: 'impact', b: S.career + 6, size: 0.7 },
  { t: 'whoosh', b: S.career + 11.3, len: 0.7 },
  // 5. Dialogues
  ...range(0.5, 6.5, 1).map((b, i) => ({ t: 'pop' as const, b: S.dialogues + b, pitch: i % 2 ? 520 : 700 })),
  { t: 'whoosh', b: S.dialogues + 7, len: 1, up: true },
  // 6. Scénarios
  ...range(0.05, 0.5, 0.07).map((b) => ({ t: 'tick' as const, b: S.scenarios + b })),
  { t: 'impact', b: S.scenarios + 0.5, size: 0.6 },
  ...range(2.25, 5, 0.5).map((b) => ({ t: 'tick' as const, b: S.scenarios + b })),
  ...[3, 3.5, 4].map((b) => ({ t: 'pop' as const, b: S.scenarios + b, pitch: 450 })),
  { t: 'click', b: S.scenarios + 5 },
  { t: 'impact', b: S.scenarios + 5.5, size: 1 },
  { t: 'chime', b: S.scenarios + 6, pitch: 988 },
  ...[7, 8, 9, 10].flatMap((b) => [
    { t: 'whoosh' as const, b: S.scenarios + b - 0.2, len: 0.25, up: true },
    { t: 'impact' as const, b: S.scenarios + b, size: 0.5 },
  ]),
  { t: 'pop', b: S.scenarios + 10.8, pitch: 260 },
  // 7. Marchés
  ...[0.75, 0.9, 1.05, 1.2].map((b) => ({ t: 'pop' as const, b: S.markets + b, pitch: 800 })),
  { t: 'chime', b: S.markets + 2.9, pitch: 880 },
  { t: 'whoosh', b: S.markets + 4, len: 0.6 },
  ...[5, 5.5, 6, 6.5].map((b) => ({ t: 'thud' as const, b: S.markets + b })),
  { t: 'impact', b: S.markets + 7.5, size: 0.7 },
  // 8. Bonus
  { t: 'riser', b: S.bonus, len: 1.6 },
  { t: 'chime', b: S.bonus + 1.6, pitch: 1175 },
  { t: 'click', b: S.bonus + 1.95 },
  { t: 'whoosh', b: S.bonus + 2, len: 0.6, up: true },
  { t: 'impact', b: S.bonus + 2.6, size: 0.6 },
  { t: 'coins', b: S.bonus + 2.6 },
  { t: 'whoosh', b: S.bonus + 3.7, len: 0.3 },
  ...range(4.05, 5.5, 0.125).map((b) => ({ t: 'tick' as const, b: S.bonus + b })),
  { t: 'impact', b: S.bonus + 5.5, size: 0.6 },
  { t: 'chime', b: S.bonus + 5.55, pitch: 1568 },
  { t: 'click', b: S.bonus + 6.75 },
  { t: 'whoosh', b: S.bonus + 6.8, len: 0.4 },
  // 9. Drop et final
  ...range(0, FINALE.dropBeats, 0.25).map((b, i) => ({ t: 'bip' as const, b: S.finale + b, pitch: [880, 1320, 1175, 1568][i % 4], gain: 0.45 })),
  { t: 'riser', b: S.finale + 2, len: 2 },
  { t: 'impact', b: SILENCE[1], size: 1.4 },
  { t: 'coins', b: SILENCE[1] + 0.1 },
  { t: 'chime', b: SILENCE[1] + 1, pitch: 880 },
  { t: 'chime', b: SILENCE[1] + 1.5, pitch: 1320 },
  { t: 'bip', b: TOTAL_BEATS - 0.5, pitch: 1000, gain: 0.6 },
];
