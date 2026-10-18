import { Billboard, Line } from '@react-three/drei';
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Flash, Slam } from '../components/Kinetic';
import { Burst, GoldDust, Shockwave, Sprite } from '../components/props3d';
import { Cam, Stage } from '../components/Stage';
import { Arc, FlatMap, Globe, Hub, hubMap, hubSphere, LAND } from '../components/World';
import { COPY } from '../copy';
import { bf, EASE, lerp, noise1, springAt, tween, useUnit } from '../lib/anim';
import { camPath, shake } from '../lib/camera';
import { C, FONT } from '../theme';

type V3 = [number, number, number];

const T = {
  call: 4,
  put: bf(1),
  trade: bf(0.4),
  collar: bf(2.5),
  couvre: bf(2.5),
  greeks: bf(0.75),
  flatten: bf(4),
  map: bf(4.6),
  flags: [bf(5), bf(5.5), bf(6), bf(6.5)],
  globe: bf(7.5),
  comprends: bf(8),
  end: bf(10),
};

// ------------------------------------------------------------------ diagramme de gain/perte

const X0 = -1.45;
const X1 = 1.45;
const call = (x: number) => Math.max(0, x - 0.1) * 1.5 - 0.45;
const put = (x: number) => Math.max(0, -0.1 - x) * 1.5 - 0.45;
const collar = (x: number) => Math.max(-0.75, Math.min(0.85, x * 1.3));
const payoff = (fn: (x: number) => number, p: number, n = 90): V3[] => {
  const pts: V3[] = [];
  for (let i = 0; i <= n * p; i++) {
    const x = X0 + ((X1 - X0) * i) / n;
    pts.push([x, fn(x), 0]);
  }
  return pts.length > 1 ? pts : [[X0, fn(X0), 0], [X0 + 0.01, fn(X0 + 0.01), 0]];
};

// Route de la carte qui prolonge le collar : New York → Francfort.
const ROUTE_A = hubMap('ny');
const ROUTE_B = hubMap('frankfurt');

const ARCS: [Hub, Hub, number][] = [
  ['ny', 'london', 0],
  ['london', 'gulf', 1],
  ['gulf', 'shanghai', 2],
  ['shanghai', 'tokyo', 2.5],
  ['saopaulo', 'ny', 1.5],
  ['frankfurt', 'singapore', 3],
];
const FLAGS: [Hub, string][] = [
  ['ny', 'flag-us'],
  ['frankfurt', 'flag-eu'],
  ['london', 'flag-uk'],
  ['shanghai', 'flag-cn'],
];
export const S7_TEXTURES = [LAND, ...FLAGS.map(([, f]) => `assets/icons/${f}.png`), 'assets/icons/oil-rig.png'];

const camBase = (f: number): Cam => {
  if (f < T.flatten) {
    const a = tween(f, 0, T.flatten, -0.75, 0.5, EASE.inOut);
    return { pos: [Math.sin(a) * 7.5, 1.4 + Math.sin(f * 0.02) * 0.3, Math.cos(a) * 7.5], target: [0, 0.1, 0], fov: 44 };
  }
  if (f < T.globe) {
    // Plongée vers la carte puis travelling d'ouest en est en suivant les flux.
    const ny = hubMap('ny');
    const eu = hubMap('frankfurt');
    const gulf = hubMap('gulf');
    const asia = hubMap('shanghai');
    return camPath(
      [
        { f: T.flatten, pos: [Math.sin(0.5) * 7.5, 1.4, Math.cos(0.5) * 7.5], target: [0, 0.1, 0], fov: 44 },
        { f: T.map, pos: [ny[0] + 1.5, 8, ny[2] + 5], target: [(ny[0] + eu[0]) / 2, 0, ny[2]], fov: 46, ease: EASE.inOut },
        { f: T.flags[2], pos: [eu[0] - 0.5, 7, eu[2] + 5], target: [gulf[0] - 0.6, 0, eu[2] + 0.4], fov: 46, ease: EASE.inOut },
        { f: T.globe, pos: [asia[0] - 1, 7, asia[2] + 5], target: [asia[0] + 0.4, 0, asia[2]], fov: 46, ease: EASE.inOut },
      ],
      f,
    );
  }
  const k = tween(f, T.globe, T.end, 0, 1, EASE.out);
  return { pos: [lerp(0.5, -0.6, k), lerp(1.2, 0.6, k), lerp(6.5, 8.2, k)], target: [0, 0, 0], fov: 44 };
};
const cam = (f: number) => shake(camBase(f), f, [...T.flags, T.globe].reduce((a, h) => a + (f >= h ? 0.08 * Math.exp(-(f - h) / 6) : 0), 0), 31);

// ------------------------------------------------------------------ compteurs de grecques

const GREEKS: [string, number][] = [
  [COPY.markets.greeks[0], 0.52],
  [COPY.markets.greeks[1], 0.08],
  [COPY.markets.greeks[2], 0.21],
  [COPY.markets.greeks[3], -0.04],
];
const Greeks: React.FC<{ f: number }> = ({ f }) => {
  const { fps, width, height } = useVideoConfig();
  const u = useUnit();
  if (f < T.greeks || f > T.flatten + 8) return null;
  const out = tween(f, T.flatten - 4, T.flatten + 8, 0, 1, EASE.in);
  const portrait = height > width;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: portrait ? '68%' : '74%',
        transform: `translateX(-50%) translateY(${out * 200 * u}px)`,
        opacity: 1 - out,
        display: 'grid',
        gridTemplateColumns: portrait ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 18 * u,
        width: portrait ? 900 * u : 1500 * u,
      }}
    >
      {GREEKS.map(([name, target], i) => {
        const at = T.greeks + i * 5;
        const s = springAt(f, fps, at, { damping: 12, stiffness: 220 });
        // Rouleau : la valeur défile vite puis se cale sur sa cible (valeurs illustratives).
        const roll = tween(f, at, at + 34, 1, 0, EASE.out);
        const v = target + noise1(f * 0.9, i) * roll * 0.9;
        const live = target + noise1(f * 0.05, i + 9) * 0.01 * (f > at + 34 ? 1 : 0);
        const shown = roll > 0.001 ? v : live;
        return (
          <div
            key={name}
            style={{
              transform: `scale(${s})`,
              padding: `${18 * u}px ${24 * u}px`,
              borderRadius: 22 * u,
              background: 'rgba(12,18,38,0.85)',
              border: `${2 * u}px solid rgba(242,192,64,0.45)`,
              boxShadow: `0 0 ${30 * u}px rgba(242,192,64,0.25)`,
              fontFamily: FONT,
            }}
          >
            <div style={{ fontSize: 26 * u, fontWeight: 800, color: C.muted, letterSpacing: '0.18em' }}>{name}</div>
            <div
              style={{
                fontSize: 70 * u,
                fontWeight: 900,
                color: shown >= 0 ? C.green : C.red,
                fontVariantNumeric: 'tabular-nums',
                filter: roll > 0.2 ? `blur(${roll * 3 * u}px)` : undefined,
              }}
            >
              {shown >= 0 ? '+' : '−'}
              {Math.abs(shown).toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------ scène

export const S7Markets: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const callP = tween(f, T.call, T.call + 30, 0, 1, EASE.out);
  const putP = tween(f, T.put, T.put + 30, 0, 1, EASE.out);
  const toCollar = tween(f, T.collar, T.collar + 22, 0, 1, EASE.inOut);
  const flat = tween(f, T.flatten, T.map, 0, 1, EASE.inOut);

  // Le collar se pose sur la carte et devient la route New York → Francfort.
  const collarPts = useMemo(() => payoff(collar, 1), []);
  const routePts = useMemo<V3[]>(() => {
    if (flat <= 0) return collarPts;
    return collarPts.map(([x, y], i) => {
      const t = i / (collarPts.length - 1);
      const r: V3 = [lerp(ROUTE_A[0], ROUTE_B[0], t), Math.sin(Math.PI * t) * 1.1, lerp(ROUTE_A[2], ROUTE_B[2], t)];
      return [lerp(x, r[0], flat), lerp(y, r[1], flat), lerp(0, r[2], flat)];
    });
  }, [flat, collarPts]);

  const globeRot = tween(f, T.globe, T.end, -0.4, 0.9, EASE.linear);
  const onMap = f >= T.flatten && f < T.globe;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage cam={cam} textures={S7_TEXTURES} bloom={1.2} fog={[8, 30]} motionBlur={0.35}>
        {f < T.flatten + 2 && (
          <>
            <gridHelper args={[4, 10, '#22305e', '#141d3d']} rotation-x={Math.PI / 2} position-z={-0.3} />
            {toCollar < 1 && (
              <>
                <Line points={payoff(call, callP)} color={C.green} lineWidth={7} toneMapped={false} transparent opacity={1 - toCollar} />
                {f >= T.put && <Line points={payoff(put, putP)} color={C.red} lineWidth={7} toneMapped={false} transparent opacity={1 - toCollar} />}
              </>
            )}
            {toCollar > 0 && <Line points={payoff(collar, toCollar)} color={C.goldHot} lineWidth={9} toneMapped={false} />}
            {toCollar > 0 && (
              <>
                <mesh position={[X0, -0.9, 0]} scale={springAt(f, fps, T.collar + 10)}>
                  <boxGeometry args={[0.7, 0.04, 0.6]} />
                  <meshBasicMaterial color={C.red} toneMapped={false} transparent opacity={0.7} />
                </mesh>
                <mesh position={[X1, 0.95, 0]} scale={springAt(f, fps, T.collar + 14)}>
                  <boxGeometry args={[0.7, 0.04, 0.6]} />
                  <meshBasicMaterial color={C.green} toneMapped={false} transparent opacity={0.7} />
                </mesh>
              </>
            )}
            <Burst frame={f} at={T.collar + 22} position={[0, 0, 0]} count={140} speed={8} life={34} seed={51} />
          </>
        )}
        {onMap && (
          <>
            <FlatMap opacity={flat} />
            <Line points={routePts} color={C.goldHot} lineWidth={7} toneMapped={false} />
            {ARCS.map(([a, b, d], i) => (
              <Arc
                key={i}
                a={hubMap(a)}
                b={hubMap(b)}
                lift={0.9}
                p={tween(f, T.map + bf(d * 0.5), T.map + bf(d * 0.5) + 26, 0, 1, EASE.out)}
                pulse={(f - T.map) / 40 + i * 0.3}
              />
            ))}
            {FLAGS.map(([hub, flag], i) => {
              const at = T.flags[i];
              const s = springAt(f, fps, at, { damping: 9, stiffness: 200 });
              const p = hubMap(hub);
              if (f < at - 10) return null;
              return (
                <React.Fragment key={flag}>
                  <Billboard position={[p[0], lerp(4, 0.55, s), p[2]]}>
                    <Sprite src={`assets/icons/${flag}.png`} scale={1.4} shadow={false} emissive={0.1} />
                  </Billboard>
                  <Shockwave frame={f} at={at + 4} position={[p[0], 0.02, p[2]]} rotation={[-Math.PI / 2, 0, 0]} radius={1.2} life={18} />
                </React.Fragment>
              );
            })}
            {(() => {
              const p = hubMap('gulf');
              const s = springAt(f, fps, T.flags[3] + 8, { damping: 10, stiffness: 180 });
              return (
                <Billboard position={[p[0] - 0.2, lerp(-1, 0.5, s), p[2] + 0.4]}>
                  <Sprite src="assets/icons/oil-rig.png" scale={1.1 * s} shadow={false} emissive={0.1} />
                </Billboard>
              );
            })()}
          </>
        )}
        {f >= T.globe && (
          <Globe radius={1.5} rotY={globeRot}>
            {ARCS.map(([a, b, d], i) => (
              <Arc
                key={i}
                a={hubSphere(a, 1.5)}
                b={hubSphere(b, 1.5)}
                lift={0.4}
                sphere={1.51}
                p={tween(f, T.globe + d * 6, T.globe + d * 6 + 24, 0, 1, EASE.out)}
                pulse={(f - T.globe) / 35 + i * 0.3}
              />
            ))}
          </Globe>
        )}
        <GoldDust frame={f} count={220} spread={[18, 10, 14]} center={[0, 2, -2]} />
      </Stage>
      <Greeks f={f} />
      <Slam text={COPY.markets.title[0]} at={T.trade} out={T.couvre - 6} y={-0.3} size={170} color={C.green} glow="rgba(34,224,122,0.8)" />
      <Slam text={COPY.markets.title[1]} at={T.couvre} out={T.flatten + 6} y={-0.3} size={170} color={C.goldHot} glow="rgba(255,190,60,0.9)" />
      <Slam text={COPY.markets.collar} at={T.collar + 12} out={T.flatten - 2} y={-0.2} size={60} tracking={0.3} weight={800} />
      <Slam text={COPY.markets.title[2]} at={T.comprends} out={T.end - 4} y={0.32} size={150} />
      <Flash at={T.globe} len={8} peak={0.7} />
    </AbsoluteFill>
  );
};
