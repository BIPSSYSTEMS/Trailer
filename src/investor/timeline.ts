/** Timing de la vidéo investisseurs, en secondes (rythme lent : une idée toutes les 8 à 10 s). */
export const IFPS = 60;
export const s = (sec: number) => Math.round(sec * IFPS);

export const ISECTIONS = [
  { id: 'intro', dur: 7 },
  { id: 'problem', dur: 8 },
  { id: 'solution', dur: 9 },
  { id: 'learn', dur: 11 },
  { id: 'trade', dur: 13 },
  { id: 'sim', dur: 9 },
  { id: 'replay', dur: 21 },
  { id: 'hedge', dur: 8 },
  { id: 'world', dur: 16 },
  { id: 'progress', dur: 8 },
  { id: 'outro', dur: 9 },
] as const;

export type ISectionId = (typeof ISECTIONS)[number]['id'];
/** Fondu enchaîné entre deux sections (s). */
export const XFADE = 0.8;

export const ISTART = {} as Record<ISectionId, number>;
{
  let t = 0;
  for (const x of ISECTIONS) {
    ISTART[x.id] = t;
    t += x.dur;
  }
}
export const ITOTAL = ISECTIONS.reduce((a, x) => a + x.dur, 0);
