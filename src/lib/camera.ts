import * as THREE from 'three';
import type { Cam } from '../components/Stage';
import { EASE, noise1 } from './anim';

type V3 = [number, number, number];

export type CamKey = {
  f: number;
  pos: V3;
  target: V3;
  fov?: number;
  roll?: number;
  /** Easing du segment qui ARRIVE sur cette clé. */
  ease?: (t: number) => number;
};

const mix3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Caméra interpolée entre des clés (frames de la scène). */
export const camPath = (keys: CamKey[], f: number): Cam => {
  if (f <= keys[0].f) return { pos: keys[0].pos, target: keys[0].target, fov: keys[0].fov ?? 40, roll: keys[0].roll ?? 0 };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (f <= b.f) {
      const t = (b.ease ?? EASE.inOut)((f - a.f) / Math.max(1, b.f - a.f));
      return {
        pos: mix3(a.pos, b.pos, t),
        target: mix3(a.target, b.target, t),
        fov: (a.fov ?? 40) + ((b.fov ?? 40) - (a.fov ?? 40)) * t,
        roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t,
      };
    }
  }
  const z = keys[keys.length - 1];
  return { pos: z.pos, target: z.target, fov: z.fov ?? 40, roll: z.roll ?? 0 };
};

/** Orbite autour d'une cible : angle en radians, rayon, hauteur. */
export const orbit = (target: V3, angle: number, radius: number, height: number): V3 => [
  target[0] + Math.sin(angle) * radius,
  target[1] + height,
  target[2] + Math.cos(angle) * radius,
];

/** Tremblement caméra (impacts, handheld léger). */
export const shake = (cam: Cam, f: number, amp: number, seed = 1): Cam => {
  if (!amp) return cam;
  return {
    ...cam,
    pos: [cam.pos[0] + noise1(f * 0.7, seed) * amp, cam.pos[1] + noise1(f * 0.8, seed + 9) * amp, cam.pos[2]],
    roll: (cam.roll ?? 0) + noise1(f * 0.5, seed + 3) * amp * 0.05,
  };
};

/**
 * Vecteur de flou de mouvement en espace écran, dérivé de la variation de caméra entre f-1 et f :
 * - dir : déplacement (en UV) du point visé → flou directionnel des whip pans,
 * - zoom : avancée relative vers la cible → flou radial des dolly rapides.
 * `shutter` = fraction d'image d'obturation (0,5 = 180°).
 */
export const motionOf = (camFn: (f: number) => Cam, f: number, aspect: number, shutter = 0.6) => {
  const a = camFn(f - 1);
  const b = camFn(f);
  const fwd = (c: Cam) => new THREE.Vector3(c.target[0] - c.pos[0], c.target[1] - c.pos[1], c.target[2] - c.pos[2]);
  const fa = fwd(a);
  const fb = fwd(b);
  const da = fa.length();
  fa.normalize();
  fb.normalize();
  // Coupe franche (saut de position ou d'orientation) : pas de flou sur l'image de coupe.
  const jump = Math.hypot(b.pos[0] - a.pos[0], b.pos[1] - a.pos[1], b.pos[2] - a.pos[2]);
  if (jump > 1.6 || fa.dot(fb) < 0.8) return { dir: [0, 0] as [number, number], zoom: 0 };
  const up = new THREE.Vector3(Math.sin(a.roll ?? 0), Math.cos(a.roll ?? 0), 0);
  const right = new THREE.Vector3().crossVectors(fa, up).normalize();
  const up2 = new THREE.Vector3().crossVectors(right, fa).normalize();
  const vfov = ((a.fov ?? 40) * Math.PI) / 180;
  const th = Math.tan(vfov / 2);
  const d = fb.dot(fa) || 1;
  // Translation latérale de la caméra : projetée à la distance de la cible.
  const move = new THREE.Vector3(b.pos[0] - a.pos[0], b.pos[1] - a.pos[1], b.pos[2] - a.pos[2]);
  const x = fb.dot(right) / d / (th * aspect) + move.dot(right) / (da * th * aspect);
  const y = fb.dot(up2) / d / th + move.dot(up2) / (da * th);
  const zoom = (move.dot(fa) / Math.max(0.5, da)) * 1.2;
  return { dir: [x * 0.5 * shutter, y * 0.5 * shutter] as [number, number], zoom: zoom * shutter };
};
