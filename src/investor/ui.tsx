import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { EASE, lerp, tween } from '../lib/anim';
import { FONT } from '../theme';
import { s } from './timeline';

/** Palette sobre de la vidéo investisseurs. */
export const IC = {
  bg: '#060a14',
  navy: '#0f1a38',
  ink: '#f4f6fb',
  muted: '#9aa4bd',
  faint: '#5d6782',
  gold: '#e3c06b',
  green: '#3ddc84',
  line: 'rgba(255,255,255,0.12)',
} as const;

const fade = (f: number, at: number, out: number | undefined, len = s(0.8)) => {
  const a = tween(f, at, at + len, 0, 1, EASE.out);
  const b = out === undefined ? 1 : tween(f, out - len * 0.7, out, 1, 0, EASE.in);
  return Math.min(a, b);
};

// ------------------------------------------------------------------ fond

/** Fond bleu nuit : halo lent, grille très discrète qui dérive. */
export const Backdrop: React.FC<{ glowX?: number; glowY?: number }> = ({ glowX = 0.68, glowY = 0.42 }) => {
  const f = useCurrentFrame();
  const t = f / 60;
  const gx = glowX + Math.sin(t * 0.07) * 0.04;
  const gy = glowY + Math.cos(t * 0.05) * 0.04;
  return (
    <AbsoluteFill style={{ background: IC.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 70% at ${gx * 100}% ${gy * 100}%, #172b5e 0%, rgba(23,43,94,0.35) 35%, rgba(6,10,20,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${IC.line} 1px, transparent 1px), linear-gradient(90deg, ${IC.line} 1px, transparent 1px)`,
          backgroundSize: '96px 96px',
          backgroundPosition: `${-t * 4}px ${-t * 2}px`,
          opacity: 0.18,
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 80%)',
        }}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ texte

export const FadeUp: React.FC<{ at: number; out?: number; dy?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  out,
  dy = 24,
  children,
  style,
}) => {
  const f = useCurrentFrame();
  const k = fade(f, at, out);
  if (k <= 0) return null;
  return (
    <div style={{ opacity: k, transform: `translateY(${(1 - Math.min(1, tween(f, at, at + s(0.9), 0, 1, EASE.out))) * dy}px)`, ...style }}>
      {children}
    </div>
  );
};

/** Colonne de texte : étiquette dorée, titre, puces qui arrivent l'une après l'autre. */
export const TextBlock: React.FC<{
  eyebrow?: string;
  title: string;
  bullets?: readonly string[];
  at: number;
  out?: number;
  x?: number;
  y?: number;
  width?: number;
  titleSize?: number;
  bulletGap?: number;
}> = ({ eyebrow, title, bullets = [], at, out, x = 140, y = 300, width = 720, titleSize = 60, bulletGap = s(0.55) }) => (
  <div style={{ position: 'absolute', left: x, top: y, width, fontFamily: FONT }}>
    {eyebrow && (
      <FadeUp at={at} out={out}>
        <div
          style={{ color: IC.gold, fontSize: 22, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 22 }}
        >
          {eyebrow}
        </div>
      </FadeUp>
    )}
    <FadeUp at={at + s(0.3)} out={out}>
      <div style={{ color: IC.ink, fontSize: titleSize, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{title}</div>
    </FadeUp>
    <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 22 }}>
      {bullets.map((b, i) => (
        <FadeUp key={b} at={at + s(1.1) + i * bulletGap} out={out} dy={14}>
          <div
            style={{ display: 'flex', gap: 18, alignItems: 'baseline', color: IC.muted, fontSize: 28, fontWeight: 500, lineHeight: 1.35 }}
          >
            <span style={{ width: 22, height: 2, background: IC.gold, flexShrink: 0, transform: 'translateY(-8px)' }} />
            {b}
          </div>
        </FadeUp>
      ))}
    </div>
  </div>
);

// ------------------------------------------------------------------ téléphone avec les vrais écrans

export const PT = { w: 390, h: 844 } as const;
export type Screen = { src: string; at: number; mode?: 'fade' | 'push' };

/** Géométrie du téléphone dans l'image (pour relier les encadrés extraits à l'écran). */
export const phoneGeom = (cx = 1400, cy = 540, height = 900) => {
  const k = height / PT.h;
  const w = PT.w * k;
  return {
    cx,
    cy,
    k,
    w,
    h: height,
    left: cx - w / 2,
    top: cy - height / 2,
    toFrame: (x: number, y: number) => [cx - w / 2 + x * k, cy - height / 2 + y * k] as const,
  };
};
export type PhoneGeom = ReturnType<typeof phoneGeom>;

const ScreenImg: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => (
  <Img src={staticFile(`app-screens/${src}.jpg`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }} />
);

export const Phone: React.FC<{
  geom: PhoneGeom;
  screens: Screen[];
  at: number;
  out?: number;
  tilt?: number;
  /** Calques dans le repère de l'écran (points iPhone 390 × 844) : doigt, surlignages. */
  children?: React.ReactNode;
}> = ({ geom, screens, at, out, tilt = -8, children }) => {
  const f = useCurrentFrame();
  const k = fade(f, at, out, s(1));
  if (k <= 0) return null;
  const t = f / 60;
  let cur = 0;
  screens.forEach((sc, i) => {
    if (f >= sc.at) cur = i;
  });
  const sc = screens[cur];
  const prev = screens[cur - 1];
  const tr = prev ? tween(f, sc.at, sc.at + s(0.6), 0, 1, EASE.inOut) : 1;
  const enter = tween(f, at, at + s(1.2), 0, 1, EASE.out);
  const rotY = tilt + Math.sin(t * 0.35) * 2.5;
  const rotX = 3 + Math.cos(t * 0.3) * 1.5;
  const bezel = 14 * geom.k;
  return (
    <AbsoluteFill style={{ perspective: 2400, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: geom.left - bezel,
          top: geom.top - bezel,
          width: geom.w + bezel * 2,
          height: geom.h + bezel * 2,
          borderRadius: 64 * geom.k,
          background: 'linear-gradient(145deg, #3b3e48, #101116 45%, #2b2d35)',
          padding: bezel,
          boxSizing: 'border-box',
          opacity: k,
          transform: `translateY(${(1 - enter) * 60 + Math.sin(t * 0.4) * 6}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
          boxShadow: `0 60px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 3px rgba(255,255,255,0.35)`,
        }}
      >
        <div
          style={{ position: 'relative', width: geom.w, height: geom.h, borderRadius: 50 * geom.k, overflow: 'hidden', background: '#fff' }}
        >
          {prev && tr < 1 && (
            <ScreenImg
              src={prev.src}
              style={
                sc.mode === 'push' ? { transform: `translateX(${-tr * 30}%)`, filter: `brightness(${1 - tr * 0.15})` } : { opacity: 1 }
              }
            />
          )}
          <ScreenImg
            src={sc.src}
            style={
              prev && sc.mode === 'push'
                ? { transform: `translateX(${(1 - tr) * 100}%)`, boxShadow: '-20px 0 40px rgba(0,0,0,0.12)' }
                : { opacity: prev ? tr : 1 }
            }
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: PT.w,
              height: PT.h,
              transform: `scale(${geom.k})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Surlignage d'une zone de l'écran (repère points iPhone). */
export const Highlight: React.FC<{ x: number; y: number; w: number; h: number; at: number; out: number }> = ({ x, y, w, h, at, out }) => {
  const f = useCurrentFrame();
  const k = fade(f, at, out, s(0.5));
  if (k <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 4,
        top: y - 4,
        width: w + 8,
        height: h + 8,
        borderRadius: 16,
        border: `2.5px solid ${IC.gold}`,
        boxShadow: `0 0 0 4000px rgba(6,10,20,${0.28 * k}), 0 0 24px rgba(227,192,107,0.6)`,
        opacity: k,
      }}
    />
  );
};

/**
 * Encadré extrait : une zone de l'écran (repère points) agrandie à côté du téléphone, reliée par un trait.
 * `pos` = centre de l'encadré dans l'image, `scale` = grossissement par rapport à l'écran du téléphone.
 */
export const Lift: React.FC<{
  geom: PhoneGeom;
  src: string;
  rect: { x: number; y: number; w: number; h: number };
  pos: [number, number];
  scale?: number;
  at: number;
  out: number;
  label?: string;
}> = ({ geom, src, rect, pos, scale = 1.9, at, out, label }) => {
  const f = useCurrentFrame();
  const k = fade(f, at, out, s(0.7));
  if (k <= 0) return null;
  const grow = tween(f, at, at + s(0.9), 0, 1, EASE.out);
  const W = rect.w * geom.k * scale;
  const H = rect.h * geom.k * scale;
  const [ax, ay] = geom.toFrame(rect.x + rect.w / 2, rect.y + rect.h / 2);
  const cx = lerp(ax, pos[0], grow);
  const cy = lerp(ay, pos[1], grow);
  const sc = lerp(1 / scale, 1, grow);
  const bgW = PT.w * geom.k * scale;
  const bgH = PT.h * geom.k * scale;
  const ex = pos[0] + (ax > pos[0] ? W / 2 : -W / 2);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: k }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <line x1={ex} y1={pos[1]} x2={ax} y2={ay} stroke={IC.gold} strokeWidth={2} strokeDasharray="6 6" opacity={grow * 0.8} />
        <circle cx={ax} cy={ay} r={6} fill={IC.gold} opacity={grow} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: cx - W / 2,
          top: cy - H / 2,
          width: W,
          height: H,
          transform: `scale(${sc})`,
          borderRadius: 22,
          overflow: 'hidden',
          backgroundImage: `url(${staticFile(`app-screens/${src}.jpg`)})`,
          backgroundSize: `${bgW}px ${bgH}px`,
          backgroundPosition: `${-rect.x * geom.k * scale}px ${-rect.y * geom.k * scale}px`,
          boxShadow: `0 40px 90px rgba(0,0,0,0.55), 0 0 0 2px ${IC.gold}`,
        }}
      />
      {label && (
        <div
          style={{
            position: 'absolute',
            left: cx - W / 2,
            top: cy - H / 2 - 52,
            fontFamily: FONT,
            fontSize: 24,
            fontWeight: 700,
            color: IC.gold,
            letterSpacing: '0.04em',
            opacity: grow,
          }}
        >
          {label}
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Fondu d'ensemble d'une section (entrée / sortie), pour enchaîner en douceur. */
export const SectionFade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(f, [0, s(0.6), durationInFrames - s(0.6), durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  void dur;
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};
