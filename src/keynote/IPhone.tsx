import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import meta from '../../public/keynote-screens/screens.json';
import { EZ, tw } from './style';

/**
 * iPhone en 3D (CSS) : écran 390 × 844 pt, bordure noire, cadre titane, épaisseur réelle (tranches empilées),
 * boutons latéraux, Dynamic Island, barre d'état, indicateur d'accueil, dos en verre avec bloc photo.
 * Proportions d'un iPhone récent (71,5 × 147,6 × 8,25 mm).
 */
export const SCREEN = { w: 390, h: 844 } as const;
const BEZEL = 9;
const RIM = 4.5;
const DEV = { w: SCREEN.w + 2 * (BEZEL + RIM), h: SCREEN.h + 2 * (BEZEL + RIM) };
const T = 46; // épaisseur en points
const R = { screen: 54, bezel: 63, outer: 67.5 };
const SLICES = 22;

export type Pose = { cx: number; cy: number; h: number; rotX?: number; rotY?: number; rotZ?: number; opacity?: number };

/** Projette un point de l'écran (pt) dans l'image, téléphone de face (pour placer les légendes). */
export const screenPoint = (p: Pose, x: number, y: number) => {
  const k = p.h / DEV.h;
  return [p.cx + (x - SCREEN.w / 2) * k, p.cy + (y - SCREEN.h / 2) * k] as const;
};

export type Shot = { src: string; at: number; mode?: 'fade' | 'push' | 'scroll' | 'cut'; dur?: number };

const isDark = (src: string) => (meta as Record<string, { dark: boolean }>)[src]?.dark ?? false;

const ScreenImg: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => (
  <Img
    src={staticFile(`keynote-screens/${src}.jpg`)}
    style={{ position: 'absolute', left: 0, top: 0, width: SCREEN.w, height: SCREEN.h, ...style }}
  />
);

/** Écrans successifs avec transition (fondu, navigation poussée, défilement, ou coupe franche). */
const Screens: React.FC<{ shots: Shot[] }> = ({ shots }) => {
  const f = useCurrentFrame();
  let i = 0;
  shots.forEach((s, j) => {
    if (f >= s.at) i = j;
  });
  const cur = shots[i];
  const prev = shots[i - 1];
  const mode = cur.mode ?? 'fade';
  const t = prev && mode !== 'cut' ? tw(f, cur.at, cur.at + (cur.dur ?? 30), 0, 1, EZ.inOut) : 1;
  const prevStyle: React.CSSProperties =
    mode === 'push'
      ? { transform: `translateX(${-t * 28}%)`, filter: `brightness(${1 - t * 0.2})` }
      : mode === 'scroll'
        ? { transform: `translateY(${-t * 22}%)`, opacity: 1 - t }
        : {};
  const curStyle: React.CSSProperties =
    mode === 'push'
      ? { transform: `translateX(${(1 - t) * 100}%)`, boxShadow: '-12px 0 30px rgba(0,0,0,0.18)' }
      : mode === 'scroll'
        ? { transform: `translateY(${(1 - t) * 22}%)`, opacity: t }
        : { opacity: t };
  return (
    <>
      {prev && t < 1 && <ScreenImg src={prev.src} style={prevStyle} />}
      <ScreenImg src={cur.src} style={curStyle} />
      <StatusBar dark={isDark(cur.src)} />
    </>
  );
};

const StatusBar: React.FC<{ dark: boolean }> = ({ dark }) => {
  const c = dark ? '#ffffff' : '#000000';
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 52,
          top: 17,
          fontFamily: '-apple-system, BipsInter, sans-serif',
          fontWeight: 600,
          fontSize: 17,
          color: c,
          letterSpacing: '-0.01em',
        }}
      >
        9:41
      </div>
      <svg width={80} height={14} viewBox="0 0 80 14" style={{ position: 'absolute', right: 30, top: 21 }}>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 5} y={10 - i * 2.6} width={3.2} height={3.4 + i * 2.6} rx={0.9} fill={c} />
        ))}
        <path
          d="M30 4.5a10 10 0 0 1 13 0l-1.4 1.5a8 8 0 0 0-10.2 0zM32.6 7.3a6 6 0 0 1 7.8 0L39 8.8a4 4 0 0 0-5 0zM35.2 10.1a2 2 0 0 1 2.6 0l-1.3 1.4z"
          fill={c}
        />
        <rect x={50} y={1.5} width={24} height={11.5} rx={3.6} fill="none" stroke={c} strokeOpacity={0.4} strokeWidth={1} />
        <rect x={52} y={3.5} width={18} height={7.5} rx={2} fill={c} />
        <rect x={75.5} y={5.2} width={1.6} height={4} rx={0.8} fill={c} fillOpacity={0.45} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: (SCREEN.w - 134) / 2,
          bottom: 8,
          width: 134,
          height: 5,
          borderRadius: 3,
          background: c,
          opacity: 0.85,
        }}
      />
    </>
  );
};

const titanium = (light: number) =>
  `linear-gradient(90deg, hsl(220 4% ${30 * light}%) 0%, hsl(220 4% ${78 * light}%) 4%, hsl(220 4% ${52 * light}%) 10%, hsl(220 4% ${38 * light}%) 50%, hsl(220 4% ${52 * light}%) 90%, hsl(220 4% ${80 * light}%) 96%, hsl(220 4% ${30 * light}%) 100%)`;

const Buttons: React.FC<{ k: number; light: number }> = ({ k, light }) => {
  const c = `hsl(220 4% ${46 * light}%)`;
  const b = (side: 'l' | 'r', y: number, h: number) => (
    <div
      key={`${side}${y}`}
      style={{
        position: 'absolute',
        [side === 'l' ? 'left' : 'right']: -2.6 * k,
        top: y * k,
        width: 3.2 * k,
        height: h * k,
        borderRadius: 2 * k,
        background: c,
      }}
    />
  );
  return <>{[b('l', 178, 34), b('l', 246, 64), b('l', 326, 64), b('r', 280, 102)]}</>;
};

export const IPhone: React.FC<{ pose: Pose; shots: Shot[]; children?: React.ReactNode; finish?: 'natural' | 'black' }> = ({
  pose,
  shots,
  children,
  finish = 'natural',
}) => {
  const k = pose.h / DEV.h;
  const W = DEV.w * k;
  const H = DEV.h * k;
  const rotY = pose.rotY ?? 0;
  const rotX = pose.rotX ?? 0;
  const rotZ = pose.rotZ ?? 0;
  // Le bord s'éclaire quand on le voit de profil.
  const light = 0.9 + 0.25 * Math.abs(Math.sin((rotY * Math.PI) / 180));
  const glare = 50 + rotY * 1.5;
  const backColor = finish === 'black' ? '#2a2a2d' : '#c9c4bb';
  return (
    <AbsoluteFill
      style={{ perspective: 2800, perspectiveOrigin: `${pose.cx}px ${pose.cy}px`, pointerEvents: 'none', opacity: pose.opacity ?? 1 }}
    >
      {/* Ombre portée douce sous le téléphone. */}
      <div
        style={{
          position: 'absolute',
          left: pose.cx - W * 0.42,
          top: pose.cy + H * 0.47,
          width: W * 0.84,
          height: H * 0.07,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(255,255,255,0.07), rgba(255,255,255,0))',
          filter: 'blur(8px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: pose.cx - W / 2,
          top: pose.cy - H / 2,
          width: W,
          height: H,
          transformStyle: 'preserve-3d',
          transform: `rotateZ(${rotZ}deg) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
        }}
      >
        {Array.from({ length: SLICES }, (_, i) => {
          const z = (-T / 2 + (T * (i + 0.5)) / SLICES) * k;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: R.outer * k,
                background: titanium(light),
                transform: `translateZ(${z}px)`,
              }}
            >
              {i > 4 && i < SLICES - 5 && <Buttons k={k} light={light} />}
            </div>
          );
        })}
        {/* Dos : verre mat, bloc photo. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: R.outer * k,
            background: `linear-gradient(160deg, ${backColor}, ${finish === 'black' ? '#1d1d20' : '#b3aea5'})`,
            transform: `translateZ(${(-T / 2 - 0.5) * k}px) rotateY(180deg)`,
            backfaceVisibility: 'hidden',
            boxShadow: `inset 0 0 0 ${RIM * k}px hsl(220 4% ${60 * light}%)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 22 * k,
              top: 22 * k,
              width: 168 * k,
              height: 178 * k,
              borderRadius: 44 * k,
              background: finish === 'black' ? '#333337' : '#d2cdc4',
              boxShadow: `0 ${2 * k}px ${8 * k}px rgba(0,0,0,0.25), inset 0 0 0 ${1 * k}px rgba(255,255,255,0.25)`,
            }}
          >
            {[
              [12, 12],
              [12, 92],
              [92, 52],
            ].map(([x, y], i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: x * k,
                  top: y * k,
                  width: 66 * k,
                  height: 66 * k,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 40% 38%, #3b4a6b 0%, #0b0d14 38%, #050608 60%)',
                  boxShadow: `0 0 0 ${5 * k}px #1b1c20, 0 0 0 ${7 * k}px #8a8a8f`,
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                left: 104 * k,
                top: 18 * k,
                width: 22 * k,
                height: 22 * k,
                borderRadius: '50%',
                background: '#f4f0e6',
                boxShadow: `0 0 0 ${2 * k}px #8a8a8f`,
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '52%',
              textAlign: 'center',
              fontFamily: 'KDisplay',
              fontWeight: 600,
              fontSize: 38 * k,
              color: finish === 'black' ? '#4a4a4f' : '#a8a39a',
              letterSpacing: '-0.02em',
            }}
          >
            BPS<span style={{ color: '#30d158' }}>.</span>
          </div>
        </div>
        {/* Face avant : cadre titane, bordure noire, écran. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: R.outer * k,
            background: `linear-gradient(135deg, hsl(220 4% ${85 * light}%), hsl(220 4% ${45 * light}%) 30%, hsl(220 4% ${70 * light}%) 60%, hsl(220 4% ${40 * light}%))`,
            transform: `translateZ(${(T / 2 + 0.5) * k}px)`,
            backfaceVisibility: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: RIM * k, borderRadius: R.bezel * k, background: '#050505' }}>
            <div style={{ position: 'absolute', inset: BEZEL * k, borderRadius: R.screen * k, overflow: 'hidden', background: '#fff' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: SCREEN.w,
                  height: SCREEN.h,
                  transform: `scale(${k})`,
                  transformOrigin: 'top left',
                }}
              >
                <Screens shots={shots} />
                {children}
                <div
                  style={{
                    position: 'absolute',
                    left: (SCREEN.w - 124) / 2,
                    top: 11,
                    width: 124,
                    height: 36,
                    borderRadius: 18,
                    background: '#000',
                  }}
                />
              </div>
              {/* Reflet du verre. */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(115deg, rgba(255,255,255,0) ${glare - 22}%, rgba(255,255,255,0.08) ${glare}%, rgba(255,255,255,0) ${glare + 22}%)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
