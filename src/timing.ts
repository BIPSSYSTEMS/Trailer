/**
 * Timing central du trailer. Tout est calé sur une grille de BPM : une scène commence et finit sur un temps,
 * chaque action d'une scène est placée en temps (beats) relatifs au début de la scène.
 *
 * Si une vraie piste arrive dans public/audio/, régler BPM et OFFSET_FRAMES (frame du premier temps).
 */
export const FPS = 60;
export const BPM = 128;
/** Images par temps (28,125 à 128 BPM / 60 fps). */
export const BEAT = (FPS * 60) / BPM;
export const OFFSET_FRAMES = 0;

/** Frame (arrondie) du temps n, compté depuis le début du trailer. */
export const beatToFrame = (n: number) => Math.round(OFFSET_FRAMES + n * BEAT);
/** Durée en frames de n temps. */
export const beats = (n: number) => Math.round(n * BEAT);

/** Scènes en temps. L'ordre est celui du montage. */
export const SCENES = [
  { id: 'hook', beats: 6 },
  { id: 'logo', beats: 8 },
  { id: 'path', beats: 12 },
  { id: 'career', beats: 12 },
  { id: 'dialogues', beats: 8 },
  { id: 'scenarios', beats: 12 },
  { id: 'markets', beats: 10 },
  { id: 'bonus', beats: 8 },
  { id: 'finale', beats: 12 },
] as const;

export type SceneId = (typeof SCENES)[number]['id'];

export const SCENE_START: Record<SceneId, number> = {} as Record<SceneId, number>;
export const SCENE_BEAT_START: Record<SceneId, number> = {} as Record<SceneId, number>;
export const SCENE_FRAMES: Record<SceneId, number> = {} as Record<SceneId, number>;
{
  let b = 0;
  for (const s of SCENES) {
    SCENE_BEAT_START[s.id] = b;
    SCENE_START[s.id] = beatToFrame(b);
    SCENE_FRAMES[s.id] = beatToFrame(b + s.beats) - beatToFrame(b);
    b += s.beats;
  }
}
export const TOTAL_BEATS = SCENES.reduce((a, s) => a + s.beats, 0);
/** Durée totale : dernier temps + 1 s de queue pour laisser respirer le carton final. */
export const TOTAL_FRAMES = beatToFrame(TOTAL_BEATS) + FPS;

/** Dans la scène finale : le drop d'icônes dure 4 temps, puis un demi-temps de silence. */
export const FINALE = { dropBeats: 4, silenceBeats: 1 } as const;
