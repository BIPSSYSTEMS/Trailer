import { Billboard, Line } from '@react-three/drei';
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Flash, Slam } from '../components/Kinetic';
import { Burst, GoldDust, Sprite } from '../components/props3d';
import { Cam, Stage } from '../components/Stage';
import { COPY } from '../copy';
import { bf, EASE, lerp, noise1, springAt, tween, useUnit } from '../lib/anim';
import { shake } from '../lib/camera';
import { C, FONT } from '../theme';

type V3 = [number, number, number];

const T = {
  briefing: 2,
  year: bf(0.5),
  rise: bf(1),
  question: bf(2.25),
  choices: [bf(3), bf(3.5), bf(4)],
  pick: bf(5),
  reveal: bf(5.5),
  bravo: bf(6),
  flashes: [bf(7), bf(8), bf(9), bf(10)],
  title: bf(10.75),
  end: bf(12),
};

/** Courbes stylisées (aucune donnée réelle, pas de graduations) : y(x) pour x ∈ [0, 1]. */
const SHAPES = {
  crash2008: (x: number) => (x < 0.55 ? -1.2 + x * 3.2 + Math.sin(x * 40) * 0.12 : 0.56 - (x - 0.55) * 7.5 + Math.sin(x * 33) * 0.15),
  svb: (x: number) => (x < 0.7 ? 0.4 + Math.sin(x * 25) * 0.15 + x * 0.6 : 0.82 - (x - 0.7) * 12),
  covid: (x: number) => (x < 0.35 ? 0.8 + Math.sin(x * 30) * 0.1 : x < 0.55 ? 0.8 - (x - 0.35) * 14 : -2 + (x - 0.55) * 7),
  oil: (x: number) => -1 + Math.exp(-(((x - 0.45) / 0.09) ** 2)) * 3.2 + Math.sin(x * 50) * 0.1 + x * 0.6,
  tariffs: (x: number) => 1 - x * 2.4 + (Math.floor(x * 9) % 2 ? 0.5 : -0.2) * (x > 0.15 ? 1 : 0),
};
const CURVE_W = 4.6;
const pointsFor = (fn: (x: number) => number, upto: number, zOff = 0) => {
  const pts: V3[] = [];
  const n = 160;
  for (let i = 0; i <= n * upto; i++) {
    const x = i / n;
    pts.push([(x - 0.5) * CURVE_W, fn(x), zOff]);
  }
  if (pts.length < 2) pts.push([-CURVE_W / 2, fn(0), zOff], [-CURVE_W / 2 + 0.01, fn(0.002), zOff]);
  return pts;
};

const FLASHES = [
  { label: COPY.scenarios.flashes[0], shape: SHAPES.svb, icon: 'bank', icon2: 'black-swan', tint: '#1b2a6b' },
  { label: COPY.scenarios.flashes[1], shape: SHAPES.covid, icon: 'black-swan', icon2: 'parachute', tint: '#4b1730' },
  { label: COPY.scenarios.flashes[2], shape: SHAPES.oil, icon: 'oil-rig', icon2: 'overflowing-barrel', tint: '#3a2a08' },
  { label: COPY.scenarios.flashes[3], shape: SHAPES.tariffs, icon: 'politician', icon2: 'scales', tint: '#123a2a' },
];
export const S6_TEXTURES = [
  ...new Set(FLASHES.flatMap((f) => [`assets/icons/${f.icon}.png`, `assets/icons/${f.icon2}.png`])),
  'assets/icons/popcorn.png',
];

const flashIndex = (f: number) => {
  let k = -1;
  T.flashes.forEach((a, i) => {
    if (f >= a) k = i;
  });
  return k;
};

/** Progression de dessin de la courbe 2008 : monte, se fige pendant la question, puis plonge à la révélation. */
const crashProgress = (f: number) =>
  f < T.reveal ? tween(f, T.rise, T.question, 0, 0.55, EASE.out) : tween(f, T.reveal, T.reveal + 22, 0.55, 1, EASE.in);

const camBase = (f: number): Cam => {
  const k = flashIndex(f);
  if (k < 0) {
    const p = crashProgress(f);
    const hx = (p - 0.5) * CURVE_W;
    const plunge = tween(f, T.reveal, T.reveal + 30, 0, 1, EASE.out);
    return {
      pos: [
        lerp(-2.5, hx * 0.6 + 1.2, tween(f, 0, T.question, 0, 1, EASE.out)),
        lerp(0.8, -0.6, plunge),
        lerp(11, 9, tween(f, 0, T.question, 0, 1)) - plunge * 1.5,
      ],
      target: [hx * 0.5, lerp(0.2, -0.6, plunge), 0],
      fov: 42,
      roll: lerp(0, -0.1, plunge),
    };
  }
  // Chaque flash : un nouvel angle (coupe franche) et un léger travelling.
  const local = f - T.flashes[k];
  const angles: [V3, V3][] = [
    [
      [-3.5, 1.5, 7.5],
      [3.2, 0.6, 8],
    ],
    [
      [3.8, -0.5, 7.5],
      [-2, 0.4, 8.5],
    ],
    [
      [0, 3.5, 7],
      [-3, 1.2, 8],
    ],
    [
      [-2.8, -1.2, 7],
      [2.5, 0.5, 8],
    ],
  ];
  const [a, b] = angles[k];
  const t = Math.min(1, local / bf(1));
  return {
    pos: [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)],
    target: [0, 0, 0],
    fov: 46,
    roll: (k % 2 ? 1 : -1) * 0.08,
  };
};
const cam = (f: number) => {
  const hits = [T.reveal, ...T.flashes].reduce((a, h) => a + (f >= h ? 0.3 * Math.exp(-(f - h) / 7) : 0), 0);
  return shake(camBase(f), f, hits, 21);
};

const Curve: React.FC<{ fn: (x: number) => number; p: number; color: string; width?: number }> = ({ fn, p, color, width = 7 }) => {
  const pts = useMemo(() => pointsFor(fn, p), [fn, p]);
  const head = pts[pts.length - 1];
  return (
    <>
      <Line points={pts} color={color} lineWidth={width} toneMapped={false} />
      <Line
        points={pts.map(([x, y, z]) => [x, y, z - 0.25] as V3)}
        color={color}
        lineWidth={width * 3}
        transparent
        opacity={0.12}
        toneMapped={false}
      />
      <mesh position={head}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </>
  );
};

const Choices: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const u = useUnit();
  if (f < T.choices[0] || f >= T.flashes[0]) return null;
  const picked = f >= T.pick;
  const out = tween(f, T.bravo + 6, T.flashes[0], 0, 1, EASE.in);
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '58%',
        width: Math.min(880 * u, 960 * u),
        transform: `translate(-50%, 0) scale(${1 - out * 0.2})`,
        opacity: 1 - out,
        display: 'flex',
        flexDirection: 'column',
        gap: 22 * u,
      }}
    >
      {COPY.scenarios.choices.map((c, i) => {
        const s = springAt(f, fps, T.choices[i], { damping: 11, stiffness: 240, mass: 0.5 });
        const good = i === COPY.scenarios.correct;
        const glow = picked && good;
        const dim = picked && !good;
        const pulse = glow ? 1 + Math.sin((f - T.pick) * 0.5) * 0.02 : 1;
        return (
          <div
            key={c}
            style={{
              opacity: f < T.choices[i] ? 0 : dim ? 0.35 : 1,
              transform: `translateX(${(1 - s) * (i % 2 ? 300 : -300) * u}px) scale(${s * pulse})`,
              padding: `${26 * u}px ${36 * u}px`,
              borderRadius: 28 * u,
              background: glow ? `linear-gradient(90deg, ${C.greenDeep}, ${C.green})` : 'rgba(20,26,48,0.88)',
              border: `${3 * u}px solid ${glow ? '#c9ffe0' : 'rgba(255,255,255,0.18)'}`,
              boxShadow: glow ? `0 0 ${70 * u}px ${C.green}` : `0 ${12 * u}px ${30 * u}px rgba(0,0,0,0.5)`,
              color: '#fff',
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 54 * u,
              display: 'flex',
              alignItems: 'center',
              gap: 24 * u,
            }}
          >
            <span
              style={{
                width: 64 * u,
                height: 64 * u,
                borderRadius: 16 * u,
                background: 'rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 38 * u,
              }}
            >
              {'ABC'[i]}
            </span>
            {c}
          </div>
        );
      })}
    </div>
  );
};

export const S6Scenarios: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const k = flashIndex(f);
  const p = crashProgress(f);
  const crashColor = f >= T.reveal ? C.red : C.green;
  const fl = k >= 0 ? FLASHES[k] : null;
  const flLocal = k >= 0 ? f - T.flashes[k] : 0;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage cam={cam} textures={S6_TEXTURES} bloom={1.2} fog={[9, 30]}>
        {k < 0 && <Curve fn={SHAPES.crash2008} p={p} color={crashColor} />}
        {k < 0 && f >= T.reveal && (
          <Burst
            frame={f}
            at={T.reveal + 20}
            position={[CURVE_W / 2, SHAPES.crash2008(1), 0]}
            count={120}
            speed={8}
            color={C.red}
            life={36}
            seed={8}
          />
        )}
        {fl && (
          <>
            <mesh position={[0, 0, -6]}>
              <planeGeometry args={[40, 30]} />
              <meshBasicMaterial color={fl.tint} toneMapped={false} />
            </mesh>
            <Curve fn={fl.shape} p={tween(flLocal, 0, bf(0.7), 0.05, 1, EASE.out)} color={k === 2 ? C.goldHot : C.red} />
            <Billboard position={[k % 2 ? -1.3 : 1.3, 1.5, 0.8]}>
              <Sprite
                src={`assets/icons/${fl.icon}.png`}
                scale={1.9 * springAt(flLocal, fps, 0, { damping: 10, stiffness: 220 })}
                shadow={false}
                emissive={0.1}
              />
            </Billboard>
            <Billboard position={[k % 2 ? 1.5 : -1.5, -1.4, 0.5]}>
              <Sprite
                src={`assets/icons/${fl.icon2}.png`}
                scale={1.3 * springAt(flLocal, fps, 6, { damping: 10, stiffness: 220 })}
                shadow={false}
                emissive={0.1}
              />
            </Billboard>
          </>
        )}
        {f >= T.title && (
          <Billboard position={[0, -0.6, 2.5]}>
            <Sprite src="assets/icons/popcorn.png" scale={1.6 * springAt(f, fps, T.title + 4)} shadow={false} emissive={0.15} />
          </Billboard>
        )}
        <GoldDust frame={f} count={200} spread={[14, 10, 10]} center={[0, 0, -2]} color={k >= 0 ? '#ffffff' : C.goldHot} />
      </Stage>

      {/* Briefing */}
      {k < 0 && f < T.flashes[0] && (
        <div
          style={{
            position: 'absolute',
            top: '9%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 34 * u,
            letterSpacing: '0.4em',
            color: C.muted,
            padding: `${10 * u}px ${24 * u}px`,
            border: `${2 * u}px solid rgba(255,255,255,0.2)`,
            borderRadius: 999,
            opacity: f < T.question ? 1 : 0,
          }}
        >
          {COPY.scenarios.briefing.slice(0, Math.max(0, Math.floor((f - T.briefing) / 2)))}
          <span style={{ opacity: Math.floor(f / 8) % 2 }}>▍</span>
        </div>
      )}
      <Slam
        text={COPY.scenarios.year}
        at={T.year}
        out={T.question - 6}
        y={-0.22}
        size={330}
        color={C.goldHot}
        glow="rgba(255,190,60,0.9)"
      />
      <Slam text={COPY.scenarios.question} at={T.question} out={T.flashes[0] - 6} y={-0.3} size={96} />
      <Choices f={f} />
      <Slam
        text={COPY.scenarios.reveal}
        at={T.bravo}
        out={T.flashes[0] - 4}
        y={-0.15}
        size={150}
        color={C.green}
        glow="rgba(34,224,122,0.9)"
      />
      {FLASHES.map((fl2, i) => (
        <Slam key={fl2.label} text={fl2.label} at={T.flashes[i] + 1} out={(T.flashes[i + 1] ?? T.title) - 6} y={-0.3} size={170} />
      ))}
      <Slam text={COPY.scenarios.title} at={T.title} out={T.end - 4} y={-0.3} size={120} glow="rgba(255,190,60,0.9)" />
      <Flash at={T.reveal} len={8} color={C.red} peak={0.4} />
      <Flash at={T.pick} len={6} color={C.green} peak={0.25} />
      {T.flashes.map((a) => (
        <Flash key={a} at={a} len={5} peak={0.85} />
      ))}
      {/* Petit grain de « rediffusion » sur les flashs. */}
      {k >= 0 && (
        <AbsoluteFill
          style={{
            background: `repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 ${2 * u}px, transparent ${2 * u}px ${6 * u}px)`,
            transform: `translateY(${noise1(f, 3) * 4}px)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
