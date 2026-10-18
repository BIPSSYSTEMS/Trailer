import { MeshReflectorMaterial } from '@react-three/drei';
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { rng } from '../lib/anim';
import { useMatcap } from '../lib/materials';
import { useTexture } from '../lib/textures';
import { C } from '../theme';

type V3 = [number, number, number];

// ------------------------------------------------------------------ pièce d'or

const coinGeo = new THREE.CylinderGeometry(1, 1, 0.16, 64, 1);
const coinRim = new THREE.TorusGeometry(0.93, 0.06, 12, 64);
const coinMark = (() => {
  // « B » stylisé en relief au centre de la face.
  const s = new THREE.Shape();
  s.moveTo(-0.35, -0.45);
  s.lineTo(0.03, -0.45);
  s.quadraticCurveTo(0.35, -0.45, 0.35, -0.2);
  s.quadraticCurveTo(0.35, 0.02, 0.13, 0.04);
  s.quadraticCurveTo(0.31, 0.08, 0.31, 0.25);
  s.quadraticCurveTo(0.31, 0.45, 0.01, 0.45);
  s.lineTo(-0.35, 0.45);
  s.lineTo(-0.35, -0.45);
  return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
})();

export const Coin: React.FC<{ position?: V3; rotation?: V3; scale?: number }> = ({ position, rotation, scale = 1 }) => {
  const gold = useMatcap('gold');
  const satin = useMatcap('goldSatin');
  if (!gold || !satin) return null;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={coinGeo} material={[satin, gold, gold]} rotation-x={Math.PI / 2} />
      <mesh geometry={coinRim} material={gold} position-z={0.08} />
      <mesh geometry={coinRim} material={gold} position-z={-0.08} />
      <mesh geometry={coinMark} material={satin} position-z={0.06} />
      <mesh geometry={coinMark} material={satin} position-z={-0.06} rotation-y={Math.PI} />
    </group>
  );
};

// ------------------------------------------------------------------ icône PNG posée en 3D

/**
 * Plan texturé avec alpha, « épaisseur » simulée (copies assombries décalées vers l'arrière)
 * et ombre de contact douce sous l'objet.
 */
export const Sprite: React.FC<{
  src: string;
  position?: V3;
  rotation?: V3;
  scale?: number;
  aspect?: number;
  thickness?: number;
  shadow?: boolean;
  opacity?: number;
  emissive?: number;
  billboardTilt?: number;
}> = ({ src, position, rotation, scale = 1, aspect = 1, thickness = 0.06, shadow = true, opacity = 1, emissive = 0 }) => {
  const tex = useTexture(src);
  const w = scale * aspect;
  const h = scale;
  const layers = 5;
  return (
    <group position={position} rotation={rotation}>
      {tex &&
        Array.from({ length: layers }, (_, i) => {
          const k = i / (layers - 1);
          const front = i === layers - 1;
          return (
            <mesh key={i} position-z={-thickness * (1 - k)} renderOrder={i}>
              <planeGeometry args={[w, h]} />
              <meshBasicMaterial
                map={tex}
                transparent
                opacity={opacity}
                alphaTest={0.08}
                depthWrite={front}
                toneMapped={false}
                color={
                  front
                    ? new THREE.Color(1 + emissive, 1 + emissive, 1 + emissive)
                    : new THREE.Color(0.28 + 0.2 * k, 0.26 + 0.2 * k, 0.3 + 0.2 * k)
                }
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}
      {shadow && <ContactBlob position={[0, -h * 0.5, 0]} size={w * 0.8} opacity={0.55 * opacity} />}
    </group>
  );
};

const blobTex = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,1)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();

export const ContactBlob: React.FC<{ position?: V3; size?: number; opacity?: number }> = ({ position, size = 1, opacity = 0.5 }) => (
  <mesh position={position} rotation-x={-Math.PI / 2} renderOrder={-1}>
    <planeGeometry args={[size, size * 0.45]} />
    <meshBasicMaterial map={blobTex} transparent opacity={opacity} depthWrite={false} />
  </mesh>
);

// ------------------------------------------------------------------ sol réfléchissant

export const Floor: React.FC<{ y?: number; mirror?: number; color?: string }> = ({ y = 0, mirror = 0.6, color = '#010204' }) => (
  <mesh rotation-x={-Math.PI / 2} position-y={y}>
    <planeGeometry args={[200, 200]} />
    <MeshReflectorMaterial
      resolution={256}
      mirror={mirror}
      blur={[120, 40]}
      mixBlur={0.8}
      mixStrength={1.1}
      roughness={1}
      metalness={0.85}
      depthScale={0.6}
      minDepthThreshold={0.4}
      maxDepthThreshold={1.4}
      color={color}
    />
  </mesh>
);

// ------------------------------------------------------------------ poussière dorée

/** Particules dorées déterministes : position = fonction pure de (graine, frame). */
export const GoldDust: React.FC<{
  frame: number;
  count?: number;
  spread?: V3;
  center?: V3;
  seed?: number;
  size?: number;
  color?: string;
}> = ({ frame, count = 400, spread = [30, 20, 30], center = [0, 4, 0], seed = 7, size = 0.06, color = C.goldHot }) => {
  const base = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => [r() - 0.5, r() - 0.5, r() - 0.5, r(), r()]);
  }, [count, seed]);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  const t = frame / 60;
  base.forEach(([x, y, z, ph, sp], i) => {
    positions[i * 3] = center[0] + x * spread[0] + Math.sin(t * (0.3 + sp) + ph * 6.28) * 0.6;
    positions[i * 3 + 1] = center[1] + (((((y + 0.5 + t * 0.03 * (0.5 + sp)) % 1) + 1) % 1) - 0.5) * spread[1];
    positions[i * 3 + 2] = center[2] + z * spread[2] + Math.cos(t * (0.25 + sp) + ph * 6.28) * 0.6;
  });
  geo.attributes.position.needsUpdate = true;
  return (
    <points geometry={geo}>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.9}
        sizeAttenuation
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// ------------------------------------------------------------------ bougie de chandelier

export const Candle: React.FC<{ position?: V3; body: number; wick: number; up: boolean; width?: number; glow?: number }> = ({
  position,
  body,
  wick,
  up,
  width = 0.32,
  glow = 1.6,
}) => {
  const col = up ? C.green : C.red;
  const h = Math.max(0.02, body);
  return (
    <group position={position}>
      <mesh position-y={h / 2}>
        <boxGeometry args={[width, h, width]} />
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={glow} roughness={0.3} metalness={0.1} toneMapped={false} />
      </mesh>
      <mesh position-y={h / 2}>
        <boxGeometry args={[width * 0.16, Math.max(h, wick), width * 0.16]} />
        <meshBasicMaterial color={col} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ billet

const noteTex = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 240;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 512, 240);
  grd.addColorStop(0, '#2fbf71');
  grd.addColorStop(1, '#127a45');
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 240);
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 6;
  g.strokeRect(14, 14, 484, 212);
  g.beginPath();
  g.arc(256, 120, 62, 0, Math.PI * 2);
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.font = '900 92px BipsInter, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('B', 256, 124);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();

export const Banknote: React.FC<{ position?: V3; rotation?: V3; scale?: number; bend?: number }> = ({ position, rotation, scale = 1 }) => (
  <mesh position={position} rotation={rotation} scale={scale}>
    <planeGeometry args={[1.6, 0.75]} />
    <meshStandardMaterial map={noteTex} side={THREE.DoubleSide} roughness={0.7} metalness={0} emissive="#0b3" emissiveIntensity={0.08} />
  </mesh>
);

// ------------------------------------------------------------------ gerbe d'étincelles

/** Gerbe de particules qui part du centre à `at` (frames de la scène). Déterministe. */
export const Burst: React.FC<{
  frame: number;
  at: number;
  position?: V3;
  count?: number;
  speed?: number;
  life?: number;
  size?: number;
  color?: string;
  seed?: number;
  flat?: boolean;
}> = ({ frame, at, position = [0, 0, 0], count = 160, speed = 6, life = 40, size = 0.09, color = C.goldHot, seed = 3, flat = false }) => {
  const dirs = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => {
      const th = r() * Math.PI * 2;
      const ph = flat ? Math.PI / 2 + (r() - 0.5) * 0.3 : Math.acos(2 * r() - 1);
      const sp = 0.35 + r() * 0.65;
      return [Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp];
    });
  }, [count, seed, flat]);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  const t = (frame - at) / 60;
  if (frame < at || frame > at + life) return null;
  const k = (1 - Math.exp(-t * 4)) / 4;
  dirs.forEach(([x, y, z], i) => {
    positions[i * 3] = position[0] + x * speed * k;
    positions[i * 3 + 1] = position[1] + y * speed * k - 2 * t * t;
    positions[i * 3 + 2] = position[2] + z * speed * k;
  });
  geo.attributes.position.needsUpdate = true;
  const fade = 1 - (frame - at) / life;
  return (
    <points geometry={geo}>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={fade}
        sizeAttenuation
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

/** Onde de choc : anneau lumineux qui s'élargit et s'efface. */
export const Shockwave: React.FC<{ frame: number; at: number; position?: V3; rotation?: V3; radius?: number; life?: number; color?: string }> = ({
  frame,
  at,
  position,
  rotation,
  radius = 6,
  life = 24,
  color = C.goldHot,
}) => {
  if (frame < at || frame > at + life) return null;
  const k = (frame - at) / life;
  const r = 0.2 + radius * (1 - Math.pow(1 - k, 3));
  return (
    <mesh position={position} rotation={rotation} scale={r}>
      <ringGeometry args={[0.92, 1, 96]} />
      <meshBasicMaterial color={color} transparent opacity={(1 - k) * 0.9} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};
