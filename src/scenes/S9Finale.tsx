import { Billboard } from '@react-three/drei';
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Flash, Slam } from '../components/Kinetic';
import { Logo3D } from '../components/Logo3D';
import { Banknote, Burst, Coin, ContactBlob, Floor, GoldDust, Shockwave, Sprite } from '../components/props3d';
import { Cam, Stage } from '../components/Stage';
import { COPY } from '../copy';
import { bf, EASE, lerp, rng, springAt, tween, useIsPortrait, useUnit } from '../lib/anim';
import { shake } from '../lib/camera';
import { useMatcap } from '../lib/materials';
import { C, FONT } from '../theme';
import { FINALE } from '../timing';

const DROP = [
  'gold-bars',
  'bull',
  'bear',
  'rocket',
  'vault',
  'black-swan',
  'oil-barrel',
  'trophy',
  'diamond',
  'money-gun',
  'piggy-bank',
  'globe',
  'coin-stack',
  'candlesticks',
  'treasure-chest',
  'medal',
] as const;
const AV_ASPECT = 338 / 900;
export const S9_TEXTURES = [
  ...DROP.map((d) => `assets/icons/${d}.png`),
  'assets/characters/man-coat.png',
  'assets/icons/bull-mascot.png',
  'assets/icons/bear-mascot.png',
];

const STEP = bf(FINALE.dropBeats) / DROP.length; // une icône par double-croche
const T = {
  dropEnd: bf(FINALE.dropBeats),
  boom: bf(FINALE.dropBeats + FINALE.silenceBeats),
  tagline: bf(6),
  enjeu: bf(6.5),
  soon: bf(7.5),
  sweeps: [bf(7), bf(9), bf(11)],
};
const SPEED = 0.55; // unités par frame dans le tunnel
const AHEAD = 5;

// ------------------------------------------------------------------ caméra

const tunnelCam = (f: number): Cam => ({
  pos: [Math.sin(f * 0.11) * 0.25, 1.5 + Math.cos(f * 0.09) * 0.2, -f * SPEED],
  target: [0, 1.5, -f * SPEED - 10],
  fov: 50,
  roll: Math.sin(f * 0.05) * 0.25,
});

const finalCam =
  (portrait: boolean) =>
  (f: number): Cam => {
    const k = tween(f, T.boom, T.boom + 40, 0, 1, EASE.out);
    const hold = (f - T.boom) * 0.006;
    const dist = portrait ? 9.4 : 10;
    return {
      pos: [lerp(0.3, -0.25, tween(f, T.boom, T.boom + bf(8), 0, 1)), lerp(1.6, 2.2, k), lerp(3.2, dist, k) - hold],
      target: [0, portrait ? 2.25 : 1.8, 0],
      fov: 40,
    };
  };

// ------------------------------------------------------------------ pluie de billets et de pièces

const Rain: React.FC<{ f: number }> = ({ f }) => {
  const items = useMemo(() => {
    const r = rng(909);
    return Array.from({ length: 70 }, () => ({
      x: (r() - 0.5) * 9,
      z: -4 + r() * 3.2,
      y0: r() * 9,
      sp: 0.03 + r() * 0.04,
      ph: r() * 6,
      coin: r() > 0.5,
      s: 0.6 + r() * 0.5,
    }));
  }, []);
  const t = f - T.boom;
  return (
    <>
      {items.map((it, i) => {
        const y = 7.5 - ((it.y0 + t * it.sp) % 9);
        const p: [number, number, number] = [it.x + Math.sin(t * 0.03 + it.ph) * 0.3, y, it.z];
        return it.coin ? (
          <Coin key={i} position={p} rotation={[t * 0.09 + it.ph, it.ph + t * 0.05, 0]} scale={0.22 * it.s} />
        ) : (
          <Banknote
            key={i}
            position={p}
            rotation={[it.ph + t * 0.05, t * 0.07 + it.ph, Math.sin(t * 0.06 + it.ph) * 0.8]}
            scale={0.6 * it.s}
          />
        );
      })}
    </>
  );
};

const Podium: React.FC = () => {
  const obsidian = useMatcap('obsidian', '#6a6f7c');
  const gold = useMatcap('gold');
  if (!obsidian || !gold) return null;
  return (
    <group>
      <mesh material={obsidian} position-y={-0.15}>
        <cylinderGeometry args={[1.25, 1.4, 0.3, 64]} />
      </mesh>
      <mesh material={gold} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1.27, 0.04, 12, 96]} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ scène

export const S9Finale: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const portrait = useIsPortrait();
  const u = useUnit();
  const inDrop = f < T.dropEnd;
  const silent = f >= T.dropEnd && f < T.boom;
  const cam = (fr: number) => {
    if (fr < T.dropEnd) return tunnelCam(fr);
    const c = finalCam(portrait)(fr);
    return shake(c, fr, fr >= T.boom ? 0.35 * Math.exp(-(fr - T.boom) / 10) : 0, 91);
  };
  const beatBg = ['#2a1d00', '#002a14', '#2a0008', '#000f2a'][Math.floor(f / bf(1)) % 4];
  const pop = (at: number, d = 10, st = 140) => springAt(f, fps, at, { damping: d, stiffness: st });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {!silent && (
        <Stage
          cam={cam}
          textures={S9_TEXTURES}
          bloom={inDrop ? 1.4 : 1.15}
          fog={inDrop ? [6, 30] : [10, 34]}
          background={inDrop ? beatBg : C.bg}
        >
          {inDrop ? (
            <>
              {DROP.map((d, i) => {
                const at = Math.round(i * STEP);
                if (f < at - 10 || f > at + 5) return null;
                const z = -(at * SPEED) - AHEAD;
                const side = [0, -0.5, 0.5, 0][i % 4];
                const s = pop(at - 4, 9, 260);
                return (
                  <Billboard key={d} position={[side, 1.5 + (i % 3 === 1 ? 0.3 : -0.1), z]}>
                    <Sprite src={`assets/icons/${d}.png`} scale={2.3 * s} shadow={false} emissive={0.15} />
                  </Billboard>
                );
              })}
              {/* Anneaux-portails sur chaque temps. */}
              {Array.from({ length: FINALE.dropBeats + 1 }, (_, b) => (
                <mesh key={b} position={[0, 1.5, -(bf(b) * SPEED) - AHEAD - 1]}>
                  <torusGeometry args={[2.6, 0.05, 8, 96]} />
                  <meshBasicMaterial color={C.goldHot} toneMapped={false} />
                </mesh>
              ))}
              {Array.from({ length: 24 }, (_, i) => {
                const r = rng(300 + i);
                const z = -r() * T.dropEnd * SPEED - 4;
                const a = r() * Math.PI * 2;
                return (
                  <Coin key={i} position={[Math.cos(a) * 2.2, 1.5 + Math.sin(a) * 2.2, z]} rotation={[f * 0.1 + i, i, 0]} scale={0.3} />
                );
              })}
            </>
          ) : (
            <>
              <Floor y={0} mirror={0.85} />
              <group position-x={portrait ? 0 : 2.2}>
                <Podium />
                <group position={[0, 1.65 * pop(T.boom, 12, 160), 0]}>
                  <Sprite src="assets/characters/man-coat.png" scale={3.3} aspect={AV_ASPECT} shadow={false} thickness={0.02} />
                </group>
                <ContactBlob position={[0, 0.02, 0.1]} size={1.8} opacity={0.6} />
                <Billboard position={[lerp(-6, -1.3, pop(T.boom + 3, 12, 120)), 1.0, -1.6]}>
                  <Sprite src="assets/icons/bull-mascot.png" scale={2.4} shadow={false} emissive={0.05} />
                </Billboard>
                <Billboard position={[lerp(6, 1.3, pop(T.boom + 3, 12, 120)), 1.0, -1.6]}>
                  <Sprite src="assets/icons/bear-mascot.png" scale={2.4} shadow={false} emissive={0.05} />
                </Billboard>
              </group>
              <Logo3D
                position={portrait ? [0, 4.55, -0.4] : [-2.6, 2.75, -0.4]}
                size={portrait ? 0.82 : 1}
                depth={0.3}
                scale={pop(T.boom + 6, 9, 160)}
                rotation={[0, Math.sin((f - T.boom) * 0.02) * 0.12, 0]}
                sweep={T.sweeps.reduce((acc, s) => (f >= s && f < s + 30 ? tween(f, s, s + 30, -1.2, 1.4, EASE.inOut) : acc), -1)}
                boost={1.3}
              />
              <Rain f={f} />
              <Burst frame={f} at={T.boom} position={[portrait ? 0 : 2.2, 2, 0.5]} count={380} speed={20} life={70} seed={95} />
              <Shockwave frame={f} at={T.boom} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} radius={12} life={30} />
              <GoldDust frame={f} count={400} spread={[18, 10, 14]} center={[0, 4, -2]} />
            </>
          )}
        </Stage>
      )}
      {silent && (
        <AbsoluteFill style={{ background: '#000', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 14 * u,
              height: 14 * u,
              borderRadius: '50%',
              background: C.goldHot,
              boxShadow: `0 0 ${40 * u}px ${C.gold}`,
              opacity: tween(f, T.dropEnd, T.boom, 1, 0.2),
            }}
          />
        </AbsoluteFill>
      )}
      <Slam
        text={COPY.finale.tagline[0]}
        at={T.tagline}
        y={portrait ? 0.31 : 0.07}
        x={portrait ? 0 : -0.24}
        size={84}
        maxWidth={portrait ? 0.9 : 0.44}
        variant="stagger"
      />
      <Slam
        text={COPY.finale.tagline[1]}
        at={T.enjeu}
        y={portrait ? 0.365 : 0.17}
        x={portrait ? 0 : -0.24}
        maxWidth={portrait ? 0.9 : 0.44}
        size={120}
        color={C.goldHot}
        glow="rgba(255,190,60,0.9)"
      />
      {f >= T.soon && (
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: (portrait ? 70 : 18) * u }}>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 38 * u,
              color: C.white,
              opacity: tween(f, T.soon, T.soon + 14, 0, 0.85),
              letterSpacing: '0.06em',
              padding: `${12 * u}px ${30 * u}px`,
              borderRadius: 999,
              border: `${2 * u}px solid rgba(255,255,255,0.3)`,
              background: 'rgba(0,0,0,0.35)',
            }}
          >
            {COPY.finale.soon}
          </div>
        </AbsoluteFill>
      )}
      {DROP.map((_, i) => (i % 4 === 0 ? <Flash key={i} at={Math.round(i * STEP)} len={4} peak={0.18} /> : null))}
      <Flash at={T.boom} len={14} />
    </AbsoluteFill>
  );
};
