import { Line, RoundedBox } from '@react-three/drei';
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import blackJson from '../../public/fonts/inter-black.typeface.json';
import semiJson from '../../public/fonts/inter-display-semibold.typeface.json';
import { useMatcap } from '../lib/materials';
import { MATCAPS } from '../lib/materials';
import { useTexture } from '../lib/textures';
import { C } from '../theme';
import { sheenMaterial } from './Logo3D';

type V3 = [number, number, number];
const FONTS: Record<'black' | 'semibold', Font> = {
  black: new FontLoader().parse(blackJson as never),
  semibold: new FontLoader().parse(semiJson as never),
};

export type LogoConcept = 'pulse' | 'monogram' | 'premium';

// ------------------------------------------------------------------ wordmark lettre par lettre

/** Géométrie d'un mot avec interlettrage réglable, centrée. Renvoie aussi la position x de chaque lettre. */
const buildWord = (word: string, font: Font, size: number, depth: number, tracking: number, bevel = true) => {
  const res = font.data.resolution;
  const geos: THREE.BufferGeometry[] = [];
  const centers: number[] = [];
  let x = 0;
  for (const ch of word) {
    const glyph = font.data.glyphs[ch];
    const g = new TextGeometry(ch, {
      font,
      size,
      depth,
      curveSegments: 10,
      bevelEnabled: bevel,
      bevelThickness: size * 0.05,
      bevelSize: size * 0.03,
      bevelSegments: 4,
    });
    g.translate(x, 0, 0);
    const adv = ((glyph?.ha ?? res * 0.6) / res) * size;
    centers.push(x + adv / 2);
    geos.push(g);
    x += adv + tracking * size;
  }
  const total = x - tracking * size;
  const capH = size * 0.73;
  geos.forEach((g) => g.translate(-total / 2, -capH / 2, -depth / 2));
  return { geos, centers: centers.map((c) => c - total / 2), width: total, capH };
};

const useMetal = () => {
  const chrome = useTexture(MATCAPS.chrome);
  const face = useMemo(() => (chrome ? sheenMaterial(chrome) : null), [chrome]);
  const side = useMemo(() => (chrome ? new THREE.MeshMatcapMaterial({ matcap: chrome, color: '#7d8597' }) : null), [chrome]);
  if (face) face.uniforms.uTint.value.set('#f2f6ff');
  return { face, side };
};

export const Wordmark: React.FC<{
  word?: string;
  weight?: 'black' | 'semibold';
  size?: number;
  depth?: number;
  tracking?: number;
  sweep?: number;
  boost?: number;
  /** Lettres qui apparaissent une à une (0 → 1 par lettre). */
  reveal?: (i: number) => number;
}> = ({ word = 'BIPS', weight = 'black', size = 1, depth = 0.35, tracking = 0.02, sweep = -1, boost = 1.25, reveal }) => {
  const { face, side } = useMetal();
  const w = useMemo(() => buildWord(word, FONTS[weight], size, depth, tracking), [word, weight, size, depth, tracking]);
  if (!face || !side) return null;
  face.uniforms.uSweep.value = sweep;
  face.uniforms.uBoost.value = boost;
  return (
    <group>
      {w.geos.map((g, i) => {
        const k = reveal ? reveal(i) : 1;
        if (k <= 0) return null;
        return <mesh key={i} geometry={g} material={[face, side]} scale={[1, k, 1]} position={[0, (1 - k) * -0.3 * size, (1 - k) * 0.8]} />;
      })}
    </group>
  );
};

export const wordMetrics = (word: string, weight: 'black' | 'semibold', size: number, tracking: number) => {
  const w = buildWord(word, FONTS[weight], size, 0.01, tracking, false);
  w.geos.forEach((g) => g.dispose());
  return w;
};

// ------------------------------------------------------------------ ligne de pouls

/** Tracé de pouls (ECG / cours) : plat, puis un pic en x0, dessiné jusqu'à `p`. */
export const pulsePoints = (x0: number, x1: number, spikeX: number, amp: number, p = 1, n = 220): V3[] => {
  const pts: V3[] = [];
  for (let i = 0; i <= n * p; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const d = x - spikeX;
    const g = (c: number, w: number) => Math.exp(-(((d - c) / w) ** 2));
    const y = amp * (1.0 * g(0, 0.05) - 0.38 * g(0.11, 0.045) - 0.12 * g(-0.12, 0.04) + 0.12 * g(-0.45, 0.1) + 0.18 * g(0.42, 0.12));
    pts.push([x, y, 0]);
  }
  return pts.length > 1 ? pts : [[x0, 0, 0], [x0 + 0.01, 0, 0]];
};

export const Pulse: React.FC<{ pts: V3[]; color?: string; width?: number; z?: number }> = ({ pts, color = C.green, width = 6, z = 0 }) => (
  <group position-z={z}>
    <Line points={pts} color={color} lineWidth={width} toneMapped={false} />
    <Line points={pts} color={color} lineWidth={width * 3.5} transparent opacity={0.18} toneMapped={false} />
    <mesh position={pts[pts.length - 1]}>
      <sphereGeometry args={[0.045, 16, 16]} />
      <meshBasicMaterial color="#eafff3" toneMapped={false} />
    </mesh>
  </group>
);

// ------------------------------------------------------------------ concepts

/**
 * A. Le « bip » intégré : le pic du pouls forme le I de BIPS. La ligne court derrière les lettres
 * et ne se voit que dans les espaces, comme un électrocardiogramme qui écrit le nom.
 */
export const LogoPulse: React.FC<{ size?: number; p?: number; sweep?: number; reveal?: (i: number) => number }> = ({ size = 1, p = 1, sweep, reveal }) => {
  const m = useMemo(() => wordMetrics('BIPS', 'black', size, 0.1), [size]);
  const spikeX = m.centers[1];
  const pts = useMemo(() => {
    const raw = pulsePoints(-m.width / 2 - 0.7 * size, m.width / 2 + 0.7 * size, spikeX, 1, p, 420);
    // Le pic monte jusqu'au haut des capitales et descend sous la ligne de base : c'est le I.
    return raw.map(([x, y, z]) => [x, y >= 0 ? y * m.capH * 0.98 : y * m.capH * 0.9, z] as V3);
  }, [m, size, p, spikeX]);
  const hide = (i: number) => (i === 1 ? 0 : reveal ? reveal(i) : 1);
  return (
    <group>
      <Wordmark size={size} tracking={0.1} sweep={sweep} reveal={hide} />
      <group position-y={-m.capH * 0.02}>
        <Pulse pts={pts} z={-size * 0.05} width={10} />
      </group>
    </group>
  );
};

/** B. Monogramme (icône d'app) + mot BIPS espacé dessous. */
export const LogoMonogram: React.FC<{ size?: number; p?: number; sweep?: number; tile?: number; word?: number }> = ({
  size = 1,
  p = 1,
  sweep,
  tile = 1,
  word = 1,
}) => {
  const navy = useMatcap('obsidian', '#5a6fb8');
  const chrome = useMatcap('chrome');
  const T = 1.7 * size;
  const pts = useMemo(() => pulsePoints(-T * 0.42, T * 0.42, T * 0.12, size * 0.55, p), [T, size, p]);
  if (!navy || !chrome) return null;
  return (
    <group>
      <group position-y={0.42 * size} scale={tile}>
        <RoundedBox args={[T + 0.08 * size, T + 0.08 * size, 0.22 * size]} radius={0.38 * size} smoothness={6} material={chrome} position-z={-0.05 * size} />
        <RoundedBox args={[T, T, 0.26 * size]} radius={0.34 * size} smoothness={6} material={navy} />
        <group position-z={0.2 * size}>
          <Wordmark word="B" size={1.05 * size} depth={0.18 * size} sweep={sweep} boost={1.5} />
        </group>
        <group position={[0, -0.02 * size, 0.42 * size]}>
          <Pulse pts={pts} width={4} />
        </group>
      </group>
      <group position-y={-0.78 * size} scale={word}>
        <Wordmark word="BIPS" weight="semibold" size={0.4 * size} depth={0.08 * size} tracking={0.5} sweep={sweep} boost={1.5} />
      </group>
    </group>
  );
};

/** C. Wordmark premium : graisse plus fine, lettres très espacées, filets chromés et liseré or. */
export const LogoPremium: React.FC<{ size?: number; p?: number; sweep?: number; reveal?: (i: number) => number }> = ({ size = 1, p = 1, sweep, reveal }) => {
  const chrome = useMatcap('chrome');
  const gold = useMatcap('gold');
  const m = useMemo(() => wordMetrics('BIPS', 'semibold', size, 0.32), [size]);
  if (!chrome || !gold) return null;
  const L = (m.width + size * 0.7) * p;
  return (
    <group>
      <Wordmark weight="semibold" size={size} depth={0.16 * size} tracking={0.32} sweep={sweep} reveal={reveal} boost={1.35} />
      {[1, -1].map((s) => (
        <mesh key={s} material={chrome} position={[0, s * (m.capH / 2 + size * 0.26), 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[size * 0.012, size * 0.012, L, 12]} />
        </mesh>
      ))}
      <mesh material={gold} position={[0, -(m.capH / 2 + size * 0.26), size * 0.02]} rotation-z={Math.PI / 4} scale={p}>
        <boxGeometry args={[size * 0.09, size * 0.09, size * 0.04]} />
      </mesh>
      <mesh position={[0, -(m.capH / 2 + size * 0.42), 0]}>
        <planeGeometry args={[L * 0.6, size * 0.006]} />
        <meshBasicMaterial color={C.goldHot} toneMapped={false} transparent opacity={0.8 * p} />
      </mesh>
    </group>
  );
};

export const LogoByConcept: React.FC<{ concept: LogoConcept; size?: number; p?: number; sweep?: number }> = ({ concept, ...rest }) =>
  concept === 'pulse' ? <LogoPulse {...rest} /> : concept === 'monogram' ? <LogoMonogram {...rest} /> : <LogoPremium {...rest} />;
