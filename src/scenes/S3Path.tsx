import { Billboard } from '@react-three/drei';
import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { Flash, Slam } from '../components/Kinetic';
import { Burst, Coin, GoldDust, Shockwave, Sprite } from '../components/props3d';
import { Cam, Stage } from '../components/Stage';
import { COPY } from '../copy';
import { bf, clamp01, EASE, lerp, springAt, tween, useUnit } from '../lib/anim';
import { shake } from '../lib/camera';
import { useMatcap } from '../lib/materials';
import { BEAT } from '../timing';
import { C, FONT } from '../theme';

type V3 = [number, number, number];

const N = 9; // bulles normales (0..8), la 9e est le boss
const BOSS = 9;
const bubblePos = (i: number): V3 => [Math.sin(i * 0.85) * 1.5, 0, -i * 2.6];
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const along = (u: number): V3 => {
  const i = Math.max(0, Math.min(BOSS - 1, Math.floor(u)));
  return lerp3(bubblePos(i), bubblePos(i + 1), u - i);
};

const POPS = ['candlesticks', 'piggy-bank', 'calculator', 'scales', 'globe', 'rocket', 'lightbulb'] as const;
export const S3_TEXTURES = [...POPS.map((p) => `assets/icons/${p}.png`), 'assets/icons/bear-mascot.png', 'assets/icons/trophy.png'];

const T = {
  pull: bf(1),
  boss: bf(8),
  hits: [bf(8.5), bf(9), bf(9.25)],
  refill: bf(9.5),
  title: bf(10),
  win: bf(10.5),
  whip: bf(11.2),
  end: bf(12),
};
/** Bulle i allumée au temps i (la 0 est déjà allumée : c'est la pièce du logo). */
const litAt = (i: number) => (i === 0 ? -100 : bf(i));

/** Progression le long du chemin : paliers sur les temps (la caméra « atterrit » sur chaque bulle). */
const progress = (f: number) => {
  const b = f / BEAT;
  return Math.max(0, Math.min(7.6, b - Math.sin(2 * Math.PI * b) / (2 * Math.PI)));
};

const camBase = (f: number): Cam => {
  const top: Cam = { pos: [0, 2.25, 0.01], target: [0, 0, 0], fov: 40 };
  const u = progress(f);
  const p = along(u);
  const track: Cam = { pos: [p[0] + Math.sin(u * 0.7) * 1.6, 4.6, p[2] + 4.6], target: [p[0], 0, p[2] - 2.4], fov: 50 };
  const bp = bubblePos(BOSS);
  const boss: Cam = { pos: [bp[0] + 1.2, 0.9, bp[2] + 7.2], target: [bp[0], 1.9, bp[2]], fov: 44 };
  const mixCam = (a: Cam, b: Cam, t: number): Cam => ({
    pos: lerp3(a.pos, b.pos, t),
    target: lerp3(a.target, b.target, t),
    fov: lerp(a.fov ?? 40, b.fov ?? 40, t),
  });
  let c = f < T.pull ? mixCam(top, track, tween(f, 0, T.pull, 0, 1, EASE.inOut)) : track;
  if (f >= bf(7.4)) c = mixCam(track, boss, tween(f, bf(7.4), T.boss, 0, 1, EASE.inOut));
  if (f >= T.boss) {
    c = { ...boss, pos: [boss.pos[0] - (f - T.boss) * 0.004, boss.pos[1], boss.pos[2] - (f - T.boss) * 0.012] };
  }
  if (f >= T.whip) {
    // Whip pan vers la droite : enchaîne sur la carrière.
    const k = tween(f, T.whip, T.end, 0, 1, EASE.whip);
    const a = k * 1.4;
    const d: V3 = [c.target[0] - c.pos[0], c.target[1] - c.pos[1], c.target[2] - c.pos[2]];
    c = { ...c, target: [c.pos[0] + d[0] * Math.cos(a) - d[2] * Math.sin(a), c.target[1], c.pos[2] + d[0] * Math.sin(a) + d[2] * Math.cos(a)] };
  }
  return c;
};

const cam = (f: number) => {
  const hit = [...T.hits, T.boss].reduce((acc, h) => acc + (f >= h ? 0.28 * Math.exp(-(f - h) / 6) : 0), 0);
  return shake(camBase(f), f, hit, 12);
};

// ------------------------------------------------------------------ bulle de leçon (façon Duolingo)

const bubbleGeo = new THREE.CylinderGeometry(0.72, 0.78, 0.34, 48);
const starGeo = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.14 : 0.32;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
})();
const lockedSide = new THREE.MeshStandardMaterial({ color: '#1b2030', roughness: 0.6, metalness: 0.2 });
const lockedTop = new THREE.MeshStandardMaterial({ color: '#363d52', roughness: 0.5, metalness: 0.1 });
const starLocked = new THREE.MeshStandardMaterial({ color: '#4b536b', roughness: 0.5 });
const starLit = new THREE.MeshBasicMaterial({ color: '#fff6d8', toneMapped: false });

const Bubble: React.FC<{ i: number; f: number; boss?: boolean }> = ({ i, f, boss }) => {
  const { fps } = useVideoConfig();
  const gold = useMatcap('gold');
  const satin = useMatcap('goldSatin');
  const top = useMatcap('goldSatin', '#a9782a');
  const lit = f >= litAt(i);
  const pop = lit ? springAt(f, fps, litAt(i), { damping: 8, stiffness: 220, mass: 0.5 }) : 0;
  const s = (boss ? 1.6 : 1) * (lit && i > 0 ? lerp(1.35, 1, pop) : 1);
  const jump = lit && i > 0 ? Math.sin(clamp01((f - litAt(i)) / 10) * Math.PI) * 0.35 : 0;
  if (!gold || !satin || !top) return null;
  const p = bubblePos(i);
  const red = new THREE.MeshStandardMaterial({ color: C.redDeep, emissive: C.red, emissiveIntensity: 0.6, toneMapped: false });
  return (
    <group position={[p[0], p[1] + jump, p[2]]} scale={s}>
      <mesh geometry={bubbleGeo} material={boss ? [red, red, red] : lit ? [gold, top, gold] : [lockedSide, lockedTop, lockedSide]} position-y={0.17} />
      <mesh geometry={starGeo} material={lit || boss ? starLit : starLocked} position-y={0.36} rotation-x={-Math.PI / 2} />
    </group>
  );
};

const Dots: React.FC<{ f: number }> = ({ f }) => {
  const gold = useMatcap('gold');
  const dots = useMemo(() => {
    const d: { pos: V3; i: number }[] = [];
    for (let i = 0; i < BOSS; i++) for (let k = 1; k <= 3; k++) d.push({ pos: along(i + k / 4), i: i + 1 });
    return d;
  }, []);
  if (!gold) return null;
  return (
    <>
      {dots.map((d, n) => (
        <mesh key={n} position={[d.pos[0], 0.05, d.pos[2]]} material={f >= litAt(d.i) - 6 ? gold : lockedTop}>
          <sphereGeometry args={[0.1, 12, 12]} />
        </mesh>
      ))}
    </>
  );
};

// ------------------------------------------------------------------ barre de vie en forme de billet

const HealthNote: React.FC<{ f: number }> = ({ f }) => {
  const u = useUnit();
  const { fps } = useVideoConfig();
  if (f < T.boss) return null;
  const appear = springAt(f, fps, T.boss, { damping: 14 });
  let hp = 1;
  T.hits.forEach((h, k) => {
    if (f >= h) hp = Math.min(hp, interpolate(f, [h, h + 6], [[1, 0.62, 0.3][k], [0.62, 0.3, 0.08][k]], { extrapolateRight: 'clamp' }));
  });
  if (f >= T.refill) hp = tween(f, T.refill, T.refill + bf(1), 0.08, 1, EASE.out);
  const refilling = f >= T.refill;
  const hitFlash = T.hits.some((h) => f >= h && f < h + 5);
  const w = 760 * u;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '13%',
        width: w,
        transform: `translate(-50%, ${lerp(-200, 0, appear)}px) rotate(${hitFlash ? -1.5 : 0}deg)`,
        padding: 14 * u,
        borderRadius: 18 * u,
        background: 'linear-gradient(135deg, #2fbf71, #0f6b3c)',
        border: `${4 * u}px solid rgba(255,255,255,0.6)`,
        boxShadow: `0 0 ${60 * u}px ${refilling ? 'rgba(34,224,122,0.8)' : hitFlash ? 'rgba(255,59,74,0.9)' : 'rgba(0,0,0,0.5)'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16 * u,
      }}
    >
      <div
        style={{
          width: 70 * u,
          height: 70 * u,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.22)',
          border: `${3 * u}px solid rgba(255,255,255,0.7)`,
          color: '#fff',
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 44 * u,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        B
      </div>
      <div style={{ flex: 1, height: 46 * u, borderRadius: 12 * u, background: 'rgba(0,30,15,0.65)', overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            width: `${hp * 100}%`,
            height: '100%',
            background: hp < 0.35 && !refilling ? `linear-gradient(90deg, ${C.red}, #ff8a5c)` : `linear-gradient(90deg, #b6ffd6, ${C.green})`,
            boxShadow: `0 0 ${20 * u}px rgba(255,255,255,0.6)`,
          }}
        />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ scène

export const S3Path: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bp = bubblePos(BOSS);
  const bossRise = springAt(f, fps, T.boss - 6, { damping: 10, stiffness: 120 });
  const bossDefeat = tween(f, T.win, T.win + 14, 0, 1, EASE.in);
  const recoil = T.hits.reduce((a, h) => a + (f >= h ? Math.exp(-(f - h) / 5) * 0.25 : 0), 0);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage cam={cam} textures={S3_TEXTURES} bloom={1.15} fog={[8, 34]}>
        {/* Pièce du logo posée sur la première bulle (raccord). */}
        {f < bf(0.6) && <Coin position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={tween(f, 0, bf(0.6), 0.72, 0.01, EASE.in)} />}
        {Array.from({ length: N }, (_, i) => (
          <Bubble key={i} i={i} f={f} />
        ))}
        <Bubble i={BOSS} f={f} boss />
        <Dots f={f} />
        {Array.from({ length: N }, (_, i) =>
          i > 0 ? (
            <React.Fragment key={i}>
              <Burst frame={f} at={litAt(i)} position={[bubblePos(i)[0], 0.5, bubblePos(i)[2]]} count={70} speed={7} life={34} size={0.12} seed={i} />
              <Shockwave frame={f} at={litAt(i)} position={[bubblePos(i)[0], 0.05, bubblePos(i)[2]]} rotation={[-Math.PI / 2, 0, 0]} radius={2.6} life={20} />
            </React.Fragment>
          ) : null,
        )}
        {/* Icônes qui jaillissent le long du chemin, une par temps. */}
        {POPS.map((p, k) => {
          const at = bf(k + 1.5);
          const s = springAt(f, fps, at, { damping: 9, stiffness: 170 });
          if (s < 0.01) return null;
          const b = bubblePos(k + 1);
          const side = k % 2 ? 1 : -1;
          return (
            <Billboard key={p} position={[b[0] + side * 1.45, lerp(-1.5, 1.1, s), b[2] - 1.3]}>
              <Sprite src={`assets/icons/${p}.png`} scale={1.35 * s} shadow={false} emissive={0.1} />
            </Billboard>
          );
        })}
        {/* Boss de fin de chapitre. */}
        {f >= T.boss - 8 && (
          <>
            <Billboard position={[bp[0], lerp(-2, 2.35, bossRise) + bossDefeat * -3, bp[2] - 0.3 - recoil]}>
              <Sprite src="assets/icons/bear-mascot.png" scale={3.1 * (1 - bossDefeat * 0.6)} shadow={false} emissive={T.hits.some((h) => f >= h && f < h + 4) ? 1.2 : 0} />
            </Billboard>
            <pointLight position={[bp[0], 1.5, bp[2] + 1.5]} color={C.red} intensity={30} distance={10} />
            <Shockwave frame={f} at={T.boss} position={[bp[0], 0.1, bp[2]]} rotation={[-Math.PI / 2, 0, 0]} radius={7} color={C.red} life={26} />
            {T.hits.map((h, k) => (
              <Burst key={k} frame={f} at={h} position={[bp[0], 2.2, bp[2] + 0.5]} count={90} speed={9} life={26} color={k % 2 ? C.goldHot : '#ff6a6a'} seed={20 + k} />
            ))}
            <Burst frame={f} at={T.win} position={[bp[0], 2, bp[2] + 0.5]} count={300} speed={16} life={50} seed={33} />
            {f >= T.win && (
              <Billboard position={[bp[0], lerp(0, 2.6, springAt(f, fps, T.win + 4)), bp[2]]}>
                <Sprite src="assets/icons/trophy.png" scale={2.2 * springAt(f, fps, T.win + 4)} shadow={false} emissive={0.2} />
              </Billboard>
            )}
          </>
        )}
        <GoldDust frame={f} count={320} spread={[16, 10, 40]} center={[0, 3, -12]} />
      </Stage>
      <HealthNote f={f} />
      <Slam text={COPY.path.boss} at={T.boss} out={T.title - 4} y={0.3} size={190} glow="rgba(255,40,60,1)" />
      <Slam text={COPY.path.chapter} at={T.boss + 6} out={T.title - 4} y={0.37} size={52} weight={800} tracking={0.12} />
      <Slam text={COPY.path.title} at={T.title} out={T.whip} y={0.3} size={190} />
      {T.hits.map((h) => (
        <Flash key={h} at={h} len={6} color={C.red} peak={0.35} />
      ))}
      <Flash at={T.win} len={8} peak={0.7} />
    </AbsoluteFill>
  );
};
