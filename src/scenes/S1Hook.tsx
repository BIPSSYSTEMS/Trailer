import { Line } from '@react-three/drei';
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Flash, Slam } from '../components/Kinetic';
import { Burst, Candle, Coin, Floor, GoldDust, Shockwave } from '../components/props3d';
import { Cam, Stage } from '../components/Stage';
import { COPY } from '../copy';
import { bf, EASE, lerp, rng, springAt, tween } from '../lib/anim';
import { camPath, shake } from '../lib/camera';
import { C } from '../theme';

/** Tracé d'électrocardiogramme : deux complexes PQRST sur une ligne plate. */
const ecg = (x: number) => {
  let y = 0;
  for (const x0 of [-1.4, 1.6]) {
    const g = (c: number, w: number) => Math.exp(-(((x - x0 - c) / w) ** 2));
    y += 0.25 * g(-0.9, 0.15) - 0.3 * g(-0.18, 0.05) + 2.6 * g(0, 0.06) - 0.75 * g(0.15, 0.06) + 0.45 * g(0.8, 0.25);
  }
  return y;
};

const N_CANDLES = 15;
const T = {
  lineStart: 4,
  lineEnd: bf(1.5),
  candles: bf(1.5),
  markets: bf(2),
  coinLaunch: bf(3),
  impact: bf(4),
  dive: bf(5.25),
  end: bf(6),
};

const IMPACT_CAM: [number, number, number] = [0, 1.5, 8];

const camBase = (f: number): Cam => {
  if (f < T.impact) {
    return camPath(
      [
        { f: 0, pos: [0, 0.9, 9.5], target: [0, 0.9, 0], fov: 38 },
        { f: T.lineEnd, pos: [0, 0.9, 8.2], target: [0, 0.9, 0], fov: 38, ease: EASE.linear },
        { f: T.coinLaunch, pos: [-4.5, -0.6, 6.5], target: [0.5, 1.6, 0], fov: 50, roll: -0.08 },
        { f: T.impact, pos: IMPACT_CAM, target: [0, 1.5, 0], fov: 42, ease: EASE.in },
      ],
      f,
    );
  }
  return camPath(
    [
      { f: T.impact, pos: [0.4, 1.7, 7.6], target: [0, 1.5, 0], fov: 42 },
      { f: T.dive, pos: [-0.3, 1.5, 6.6], target: [0, 1.5, 0], fov: 42, ease: EASE.linear },
      { f: T.end, pos: [0, 1.5, 1.45], target: [0, 1.5, 0], fov: 42, ease: EASE.in },
    ],
    f,
  );
};

const cam = (f: number) => shake(camBase(f), f, f >= T.impact ? 0.35 * Math.exp(-(f - T.impact) / 9) : 0, 4);

export const S1Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const candles = useMemo(() => {
    const r = rng(11);
    let level = -1.2;
    return Array.from({ length: N_CANDLES }, (_, i) => {
      const up = i === 4 || i === 9 ? false : r() > 0.12;
      const body = 0.35 + r() * 1.1;
      level += up ? body * 0.7 : -body * 0.45;
      return { x: (-7 + i) * 0.62, base: up ? level - body * 0.55 : level, body, wick: body + 0.3 + r() * 0.6, up };
    });
  }, []);

  // Ligne d'ECG : dessinée de gauche à droite, puis écrasée quand les bougies montent.
  const head = tween(f, T.lineStart, T.lineEnd, -5.5, 5.5, EASE.linear);
  const flatten = tween(f, T.candles, T.candles + 14, 1, 0, EASE.in);
  const lineFade = tween(f, T.candles + 6, T.candles + 20, 1, 0);
  const pts = useMemo(() => {
    const p: [number, number, number][] = [];
    for (let x = -5.5; x <= head; x += 0.03) p.push([x, 0.2 + ecg(x) * flatten, 0]);
    if (p.length < 2) p.push([-5.5, 0.2, 0], [-5.49, 0.2, 0]);
    return p;
  }, [head, flatten]);

  // Pièce : décolle loin derrière les bougies et fonce sur la caméra.
  const k = tween(f, T.coinLaunch, T.impact, 0, 1, EASE.in);
  const coinPre = {
    pos: [lerp(3, IMPACT_CAM[0], k), lerp(4, IMPACT_CAM[1], k), lerp(-40, IMPACT_CAM[2] - 1.1, k)] as [number, number, number],
    rot: [f * 0.12, f * 0.31, 0.3] as [number, number, number],
  };
  const settle = springAt(f, fps, T.impact, { damping: 14, stiffness: 120 });
  const coinPost = {
    rot: [lerp(-0.5, 0, tween(f, T.impact, T.end, 0, 1)), lerp(Math.PI * 1.2, 0, settle) + Math.sin(f * 0.05) * 0.05, 0] as [number, number, number],
    scale: lerp(3, 1.45, settle),
  };

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage cam={cam} bloom={1.25} fog={[10, 45]}>
        {f < T.candles + 22 && (
          <>
            <Line points={pts} color={C.green} lineWidth={6} transparent opacity={lineFade} toneMapped={false} />
            <mesh position={[head, 0.2 + ecg(head) * flatten, 0]} visible={f < T.lineEnd + 4}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial color="#d9ffe9" toneMapped={false} />
            </mesh>
          </>
        )}
        {f >= T.candles - 2 && <Floor y={-2.2} mirror={0.7} />}
        <group position={[0, 0.2, f < T.impact ? 0 : -6]}>
          {candles.map((c, i) => {
            const s = springAt(f, fps, T.candles + i * 2, { damping: 10, stiffness: 160 });
            if (s <= 0.001) return null;
            return <Candle key={i} position={[c.x, c.base, 0]} body={c.body * s} wick={c.wick * s} up={c.up} width={0.36} />;
          })}
        </group>
        {f >= T.coinLaunch && f < T.impact && <Coin position={coinPre.pos} rotation={coinPre.rot} scale={1} />}
        {f >= T.impact && (
          <>
            <Coin position={[0, 1.5, 0]} rotation={coinPost.rot} scale={coinPost.scale} />
            <Burst frame={f} at={T.impact} position={[0, 1.5, 0.5]} count={260} speed={16} life={60} size={0.12} />
            <Shockwave frame={f} at={T.impact} position={[0, 1.5, -0.5]} radius={9} />
          </>
        )}
        <GoldDust frame={f} count={300} spread={[26, 14, 24]} center={[0, 2, -4]} />
      </Stage>
      <Slam text={COPY.hook[0]} at={T.markets} out={T.coinLaunch + 14} y={-0.27} size={130} />
      <Slam text={COPY.hook[1]} at={T.impact + 2} out={T.dive} y={0.29} size={200} glow="rgba(255,190,60,0.9)" />
      <Flash at={T.impact} len={12} />
      <Flash at={0} len={5} color={C.green} peak={0.25} />
    </AbsoluteFill>
  );
};
