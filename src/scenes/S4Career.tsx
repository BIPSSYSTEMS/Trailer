import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { Flash, Slam } from '../components/Kinetic';
import { Burst, ContactBlob, Floor, GoldDust, Shockwave, Sprite } from '../components/props3d';
import { Cam, Stage } from '../components/Stage';
import { COPY } from '../copy';
import { beatPulse, bf, EASE, lerp, springAt, tween, useUnit } from '../lib/anim';
import { camPath, shake } from '../lib/camera';
import { useMatcap } from '../lib/materials';
import { C } from '../theme';

const OUTFITS = ['hoodie', 'shirt', 'blazer', 'suit', 'three-piece'] as const;
export const S4_TEXTURES = [...OUTFITS.map((o) => `assets/characters/man-${o}.png`), 'assets/characters/woman-three-piece.png'];

const AV_H = 3.3;
const AV_ASPECT = 338 / 900;

const T = {
  label0: bf(0.35),
  changes: [bf(1), bf(2), bf(3), bf(4)],
  split: bf(6),
  title: bf(8),
  end: bf(12),
};
const SPIN = 16;
const spinAngle = (f: number, at: number) => tween(f, at - 5, at - 5 + SPIN, 0, Math.PI * 2, EASE.inOut);

const camBase = (f: number): Cam => {
  const c = camPath(
    [
      { f: 0, pos: [-3.4, 1.4, 6.8], target: [-4.5, 1.7, 0], fov: 42 },
      { f: 12, pos: [-1.6, 1.0, 6.6], target: [0, 1.8, 0], fov: 40, ease: EASE.out },
      { f: T.split - 10, pos: [1.2, 0.7, 5.6], target: [0, 1.85, 0], fov: 40, ease: EASE.linear },
      { f: T.split + 10, pos: [0, 1.2, 8.4], target: [0, 1.75, 0], fov: 40, ease: EASE.out },
      { f: T.end, pos: [0, 1.0, 7.4], target: [0, 1.8, 0], fov: 40, ease: EASE.linear },
    ],
    f,
  );
  // Petit coup de zoom sur chaque temps.
  return { ...c, fov: (c.fov ?? 40) - beatPulse(f, 7) * 1.6 };
};
const cam = (f: number) =>
  shake(
    camBase(f),
    f,
    T.changes.reduce((a, h) => a + (f >= h ? 0.12 * Math.exp(-(f - h) / 6) : 0), 0),
    5,
  );

const Podium: React.FC<{ x: number }> = ({ x }) => {
  const obsidian = useMatcap('obsidian', '#6a6f7c');
  const gold = useMatcap('gold');
  if (!obsidian || !gold) return null;
  return (
    <group position={[x, 0, 0]}>
      <mesh material={obsidian} position-y={-0.15}>
        <cylinderGeometry args={[1.05, 1.15, 0.3, 64]} />
      </mesh>
      <mesh material={gold} position-y={0.0} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1.07, 0.035, 12, 96]} />
      </mesh>
    </group>
  );
};

const Halo: React.FC<{ f: number; x: number; boost: number }> = ({ f, x, boost }) => (
  <group position={[x, AV_H * 0.55, -0.8]} rotation={[0, 0, f * 0.01]}>
    <mesh>
      <torusGeometry args={[1.55, 0.02, 8, 128]} />
      <meshBasicMaterial color={C.goldHot} toneMapped={false} transparent opacity={0.5 + boost * 0.5} />
    </mesh>
    <mesh rotation-z={0.6}>
      <torusGeometry args={[1.85, 0.01, 8, 128, Math.PI * 1.2]} />
      <meshBasicMaterial color={C.gold} toneMapped={false} transparent opacity={0.6} />
    </mesh>
    <mesh position-z={-0.3}>
      <circleGeometry args={[1.5, 64]} />
      <meshBasicMaterial color="#2a3f8f" transparent opacity={0.22 + boost * 0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  </group>
);

const Avatar: React.FC<{ src: string; x: number; rotY: number; scale?: number }> = ({ src, x, rotY, scale = 1 }) => (
  <group position={[x, (AV_H / 2) * scale, 0]} rotation={[0, rotY, 0]}>
    <Sprite src={src} scale={AV_H * scale} aspect={AV_ASPECT} shadow={false} thickness={0.02} />
  </group>
);

export const S4Career: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();

  // Tenue courante : on change de texture quand le personnage est de profil (rotation = 90°).
  let outfit = 0;
  let rot = 0;
  T.changes.forEach((at, j) => {
    const a = spinAngle(f, at);
    if (f >= at - 5) rot = a;
    if (a >= Math.PI / 2) outfit = j + 1;
  });
  const split = tween(f, T.split - 4, T.split + 10, 0, 1, EASE.out);
  const manX = lerp(0, -0.95, split);
  const woman = springAt(f, fps, T.split, { damping: 13, stiffness: 120 });
  const womanRot = tween(f, T.split, T.split + 20, -Math.PI * 2, 0, EASE.out);
  const pulse = beatPulse(f, 8);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage cam={cam} textures={S4_TEXTURES} bloom={1.05} fog={[9, 30]}>
        <Floor y={-0.3} mirror={0.8} />
        <Halo f={f} x={manX} boost={pulse} />
        <Podium x={manX} />
        <Avatar src={`assets/characters/man-${OUTFITS[outfit]}.png`} x={manX} rotY={rot} />
        <ContactBlob position={[manX, 0.02, 0.1]} size={1.6} opacity={0.6} />
        {f >= T.split - 2 && (
          <>
            <Halo f={-f} x={0.95} boost={pulse} />
            <Podium x={0.95} />
            <Avatar src="assets/characters/woman-three-piece.png" x={0.95} rotY={womanRot} scale={woman} />
            <Burst frame={f} at={T.split} position={[0.95, 1.8, 0.3]} count={160} speed={10} life={40} seed={41} />
          </>
        )}
        {T.changes.map((at, j) => (
          <React.Fragment key={at}>
            <Burst frame={f} at={at} position={[manX, 1.8, 0.3]} count={140} speed={11} life={36} seed={j + 2} />
            <Shockwave frame={f} at={at} position={[manX, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} radius={4} life={20} />
          </React.Fragment>
        ))}
        {/* Faisceaux verticaux derrière le personnage. */}
        {[-1.6, -0.5, 0.6, 1.7].map((x, i) => (
          <mesh key={i} position={[x, 3, -3]} rotation={[0, 0, (i - 1.5) * 0.12]}>
            <planeGeometry args={[0.25, 9]} />
            <meshBasicMaterial
              color={C.gold}
              transparent
              opacity={0.05 + pulse * 0.06}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
        <GoldDust frame={f} count={260} spread={[12, 8, 10]} center={[0, 3, -2]} />
      </Stage>
      {f >= T.split - 2 && (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '-10%',
              width: 6 * u,
              height: `${120 * split}%`,
              background: `linear-gradient(${C.goldHot}, ${C.gold})`,
              boxShadow: `0 0 ${30 * u}px ${C.gold}`,
              transform: 'translateX(-50%)',
              transformOrigin: 'top center',
            }}
          />
        </AbsoluteFill>
      )}
      <Slam text={COPY.career.grades[0]} at={T.label0} out={T.changes[0] - 3} y={0.33} size={150} glow="rgba(255,190,60,1)" />
      {T.changes.map((at, j) => (
        <Slam
          key={at}
          text={COPY.career.grades[j + 1]}
          at={at}
          out={j < 3 ? T.changes[j + 1] - 3 : T.split - 4}
          y={0.33}
          size={j === 3 ? 260 : 150}
          glow="rgba(255,190,60,1)"
        />
      ))}
      <Slam text={COPY.career.title} at={T.title} out={T.end - 6} y={0.36} size={120} />
      {T.changes.map((at) => (
        <Flash key={at} at={at} len={6} peak={0.65} />
      ))}
      <Flash at={T.split} len={8} peak={0.5} />
    </AbsoluteFill>
  );
};
