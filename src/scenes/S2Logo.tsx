import { Billboard } from '@react-three/drei';
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Flash } from '../components/Kinetic';
import { Logo3D } from '../components/Logo3D';
import { Burst, Coin, Floor, GoldDust, Shockwave, Sprite } from '../components/props3d';
import { Cam, Stage } from '../components/Stage';
import { COPY } from '../copy';
import { bf, EASE, lerp, springAt, tween } from '../lib/anim';
import { orbit, shake } from '../lib/camera';
import { C } from '../theme';

const ICONS = ['gold-bars', 'bull', 'rocket', 'coin-stack', 'vault', 'bear', 'diamond', 'trophy'] as const;
export const S2_TEXTURES = ICONS.map((i) => `assets/icons/${i}.png`);

const T = {
  pullEnd: bf(1),
  orbitEnd: bf(5),
  suck: bf(4.75),
  logo: bf(5.5),
  sweep1: bf(6),
  sweep2: bf(7),
  coinOut: bf(7.1),
  end: bf(8),
};
const CENTER: [number, number, number] = [0, 1.4, 0];

const camBase = (f: number): Cam => {
  // Recul depuis la face de la pièce, orbite de 360° autour de l'anneau, puis face au logo.
  const dist = f < T.pullEnd ? lerp(1.45, 11, tween(f, 0, T.pullEnd, 0, 1, EASE.out)) : lerp(11, 8.6, tween(f, T.orbitEnd, T.logo, 0, 1));
  const a = tween(f, 4, T.orbitEnd, 0, Math.PI * 2, EASE.inOut);
  const h = Math.sin(tween(f, 0, T.orbitEnd, 0, Math.PI)) * 2.2 - (f > T.orbitEnd ? 0 : 0);
  const pos = orbit(CENTER, a, dist, h);
  if (f >= T.coinOut) {
    // Plongée finale : la caméra avance vers la pièce qui sort de derrière le logo.
    const k = tween(f, T.coinOut, T.end, 0, 1, EASE.in);
    return { pos: [pos[0], lerp(pos[1], 2.4, k), lerp(pos[2], 3.2, k)], target: [0, lerp(CENTER[1], 2.4, k), 0], fov: 40 };
  }
  return { pos, target: CENTER, fov: 40 };
};
const cam = (f: number) => shake(camBase(f), f, f >= T.logo ? 0.3 * Math.exp(-(f - T.logo) / 8) : 0, 7);

export const S2Logo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const suck = tween(f, T.suck, T.logo, 0, 1, EASE.in);
  const ringR = lerp(2.3, 0, suck);
  const spin = f * 0.02 + suck * suck * 9;
  const pop = springAt(f, fps, T.logo, { damping: 9, stiffness: 140, mass: 0.7 });
  const logoRotY = lerp(-0.9, 0, springAt(f, fps, T.logo, { damping: 16, stiffness: 60 })) + Math.sin(f * 0.03) * 0.04;
  const sweep = f < T.sweep2 ? tween(f, T.sweep1, T.sweep1 + 30, -1.2, 1.4, EASE.inOut) : tween(f, T.sweep2, T.sweep2 + 26, -1.2, 1.4, EASE.inOut);
  const coinK = tween(f, T.coinOut, T.end, 0, 1, EASE.in);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage cam={cam} textures={S2_TEXTURES} bloom={1.1} fog={[10, 40]}>
        <Floor y={-0.9} mirror={0.75} />
        {/* Pièce centrale : celle du hook, vue de très près au départ. */}
        {f < T.logo && (
          <Coin position={CENTER} rotation={[0, tween(f, T.pullEnd, T.logo, 0, Math.PI * 3, EASE.in), 0]} scale={lerp(1, 0.2, suck)} />
        )}
        {/* Anneau d'icônes en orbite, aspiré au centre avant le logo. */}
        {f < T.logo &&
          ICONS.map((icon, i) => {
            const a = spin + (i / ICONS.length) * Math.PI * 2;
            const y = CENTER[1] + Math.sin(a * 2 + i) * 0.35;
            const s = lerp(1.15, 0.05, suck) * springAt(f, fps, 2 + i * 2, { damping: 12 });
            return (
              <Billboard key={icon} position={[Math.cos(a) * ringR, y, Math.sin(a) * ringR]}>
                <Sprite src={`assets/icons/${icon}.png`} scale={s} shadow={false} emissive={0.12} />
              </Billboard>
            );
          })}
        {f < T.logo &&
          Array.from({ length: 10 }, (_, i) => {
            const a = -spin * 1.3 + (i / 10) * Math.PI * 2;
            const r = ringR * 1.45;
            return (
              <Coin key={i} position={[Math.cos(a) * r, CENTER[1] + Math.cos(a * 3) * 0.8, Math.sin(a) * r]} rotation={[f * 0.08 + i, i, 0]} scale={lerp(0.32, 0.02, suck)} />
            );
          })}
        {f >= T.logo && (
          <>
            <Logo3D word={COPY.logo.word} size={0.95} depth={0.36} position={CENTER} rotation={[0, logoRotY, 0]} scale={pop} sweep={sweep} boost={1.3} />
            <Burst frame={f} at={T.logo} position={CENTER} count={320} speed={18} life={70} size={0.1} />
            <Shockwave frame={f} at={T.logo} position={[0, CENTER[1], -0.6]} radius={8} />
            <Shockwave frame={f} at={T.logo + 4} position={[0, -0.85, 0]} rotation={[-Math.PI / 2, 0, 0]} radius={10} life={30} />
          </>
        )}
        {f >= T.coinOut && <Coin position={[lerp(1.2, 0, coinK), lerp(2.6, 2.4, coinK), lerp(-6, 1.6, coinK)]} rotation={[0, lerp(Math.PI * 3, 0, coinK), 0]} scale={0.9} />}
        <GoldDust frame={f} count={350} spread={[24, 12, 24]} center={[0, 3, 0]} />
      </Stage>
      <Flash at={T.logo} len={10} />
    </AbsoluteFill>
  );
};
