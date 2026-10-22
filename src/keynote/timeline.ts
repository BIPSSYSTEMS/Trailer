/** Déroulé de la vidéo keynote Base Point (durées en secondes). */
export const KSECTIONS = [
  { id: 'intro', dur: 10 },
  { id: 'promise', dur: 6 },
  { id: 'reveal', dur: 10 },
  { id: 'overview', dur: 11 },
  { id: 'parcours', dur: 17 },
  { id: 'marches', dur: 14 },
  { id: 'simulation', dur: 9 },
  { id: 'options', dur: 13 },
  { id: 'hedge', dur: 11 },
  { id: 'scenarios', dur: 19 },
  { id: 'carte', dur: 15 },
  { id: 'entretien', dur: 10 },
  { id: 'carriere', dur: 10 },
  { id: 'sources', dur: 7 },
  { id: 'outro', dur: 12 },
] as const;

export type KSectionId = (typeof KSECTIONS)[number]['id'];
export const KXFADE = 0.8;
export const KSTART = {} as Record<KSectionId, number>;
{
  let t = 0;
  for (const x of KSECTIONS) {
    KSTART[x.id] = t;
    t += x.dur;
  }
}
export const KTOTAL = KSECTIONS.reduce((a, x) => a + x.dur, 0);
