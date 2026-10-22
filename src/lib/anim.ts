import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BEAT } from '../timing';

/** Générateur pseudo-aléatoire déterministe (mulberry32). Même graine → même suite, à chaque rendu. */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Bruit 1D lisse et déterministe (pour le tremblement caméra). */
export const noise1 = (x: number, seed = 0) => {
  const h = (n: number) => {
    const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return (h(i) * (1 - u) + h(i + 1) * u) * 2 - 1;
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Interpolation bornée avec easing. */
export const tween = (
  f: number,
  from: number,
  to: number,
  a: number,
  b: number,
  easing: (t: number) => number = Easing.bezier(0.22, 1, 0.36, 1),
) => interpolate(f, [from, to], [a, b], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });

export const EASE = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  in: Easing.bezier(0.64, 0, 0.78, 0),
  inOut: Easing.bezier(0.83, 0, 0.17, 1),
  whip: Easing.bezier(0.7, 0, 0.1, 1),
  linear: (t: number) => t,
};

/** Frame (dans la scène) du temps b. */
export const bf = (b: number) => Math.round(b * BEAT);

/** Spring standard du trailer : nerveux, léger dépassement. */
export const useSpringAt = (startFrame: number, config: { damping?: number; stiffness?: number; mass?: number } = {}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - startFrame, fps, config: { damping: 12, stiffness: 180, mass: 0.6, ...config } });
};

export const springAt = (
  frame: number,
  fps: number,
  startFrame: number,
  config: { damping?: number; stiffness?: number; mass?: number } = {},
) => spring({ frame: frame - startFrame, fps, config: { damping: 12, stiffness: 180, mass: 0.6, ...config } });

/** Pulsation 1 → 0 qui décroît après chaque temps (pour les flashs, le bloom, le zoom de beat). */
export const beatPulse = (frame: number, decay = 10) => {
  const t = ((frame % BEAT) + BEAT) % BEAT;
  return Math.exp(-t / decay);
};

/** Format vertical (9:16) ou horizontal. */
export const useIsPortrait = () => {
  const { width, height } = useVideoConfig();
  return height > width;
};

/** Unité de taille pour le DOM : 1 = 1 px sur le petit côté d'un rendu 1080. */
export const useUnit = () => {
  const { width, height } = useVideoConfig();
  return Math.min(width, height) / 1080;
};
