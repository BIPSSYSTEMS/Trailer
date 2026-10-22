/**
 * Pub Gen Z (TikTok / Reels / Shorts) : découpage en secondes, calé sur une musique à 120 BPM (un temps = 0,5 s).
 * Les débuts de la voix off sont dans voix.json ; ceux-ci sont les coupes image et les accents de la musique.
 */
export const BPM = 120;
export const BEAT = 60 / BPM;

export const AD = {
  hook: 0,
  normal: 2.0, // drop de la musique
  lecons: 4.5,
  trading: 8.5,
  simu: 12.0,
  scenarios: 15.0,
  verite: 19.0, // coupure d'un temps, puis impact
  carriere: 20.5,
  fin: 23.5,
  end: 30.0,
} as const;

export type AdScene = Exclude<keyof typeof AD, 'end' | 'verite'>;
export const AD_ORDER: AdScene[] = ['hook', 'normal', 'lecons', 'trading', 'simu', 'scenarios', 'carriere', 'fin'];
