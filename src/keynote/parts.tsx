import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Pose, screenPoint } from './IPhone';
import { DISPLAY, EZ, K, sec, tw } from './style';

/** Largeur d'un texte dans la police d'affichage (mesurée au rendu, la police est déjà chargée). */
export const measure = (text: string, weight: number, size: number, trackingEm = 0) => {
  if (typeof document === 'undefined') return text.length * size * 0.6;
  const c = document.createElement('canvas').getContext('2d')!;
  c.font = `${weight} ${size}px ${DISPLAY}`;
  return c.measureText(text).width + trackingEm * size * text.length;
};

/** Marque « BPS. » : lettres en encre, point vert. */
export const BpsMark: React.FC<{ size: number; color?: string; dot?: number; letters?: number }> = ({
  size,
  color = K.ink,
  dot = 1,
  letters = 1,
}) => {
  const d = size * 0.19;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        fontFamily: DISPLAY,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: '-0.035em',
        color,
        lineHeight: 1,
      }}
    >
      <span style={{ opacity: letters }}>BPS</span>
      <span
        style={{
          display: 'inline-block',
          width: d,
          height: d,
          borderRadius: '50%',
          background: K.green,
          marginLeft: size * 0.05,
          transform: `scale(${dot})`,
        }}
      />
    </div>
  );
};

/** Légende fine reliée à un point de l'écran du téléphone (téléphone de face). */
export const Callout: React.FC<{
  pose: Pose;
  pt: [number, number];
  label: [number, number];
  text: string;
  sub?: string;
  at: number;
  out: number;
  align?: 'left' | 'right';
}> = ({ pose, pt, label, text, sub, at, out, align = 'left' }) => {
  const f = useCurrentFrame();
  if (f < at || f > out) return null;
  const a = tw(f, at, at + sec(0.8), 0, 1, EZ.out);
  const b = tw(f, out - sec(0.5), out, 1, 0, EZ.in);
  const o = Math.min(a, b);
  const [px, py] = screenPoint(pose, pt[0], pt[1]);
  const lx = label[0];
  const ly = label[1];
  const endX = align === 'left' ? lx + 14 : lx - 14;
  const draw = tw(f, at, at + sec(0.7), 0, 1, EZ.out);
  const ex = endX + (px - endX) * draw;
  const ey = ly + (py - ly) * draw;
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: 'none' }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <line x1={endX} y1={ly} x2={ex} y2={ey} stroke="rgba(245,245,247,0.55)" strokeWidth={1.5} />
        <circle cx={px} cy={py} r={7 * draw} fill={K.green} />
        <circle cx={px} cy={py} r={16 * draw} fill="none" stroke={K.green} strokeOpacity={0.35} strokeWidth={2} />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: ly - 20,
          ...(align === 'left' ? { right: 1920 - lx + 6 } : { left: lx + 6 }),
          textAlign: align === 'left' ? 'right' : 'left',
          fontFamily: DISPLAY,
          transform: `translateY(${(1 - a) * 10}px)`,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, color: K.ink, letterSpacing: '-0.015em', whiteSpace: 'nowrap' }}>{text}</div>
        {sub && <div style={{ fontSize: 22, fontWeight: 500, color: K.gray, marginTop: 4, whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
    </AbsoluteFill>
  );
};

/** Fond : noir, halo très léger derrière le sujet. */
export const Glow: React.FC<{ x?: number; y?: number; strength?: number }> = ({ x = 0.5, y = 0.5, strength = 1 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 45% 55% at ${x * 100}% ${y * 100}%, rgba(255,255,255,${0.07 * strength}), rgba(0,0,0,0) 70%)`,
    }}
  />
);

/** Liste numérotée sobre (étapes), l'étape active en blanc. */
export const Steps: React.FC<{ items: readonly string[]; active: number; at: number; x: number; y: number }> = ({
  items,
  active,
  at,
  x,
  y,
}) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', left: x, top: y, fontFamily: DISPLAY }}>
      {items.map((it, i) => {
        const k = tw(f, at + i * sec(0.2), at + i * sec(0.2) + sec(0.8), 0, 1, EZ.out);
        const on = i === active;
        return (
          <div
            key={it}
            style={{ display: 'flex', alignItems: 'center', gap: 22, height: 64, opacity: k * (on ? 1 : i < active ? 0.45 : 0.3) }}
          >
            <div style={{ width: 4, height: 34, borderRadius: 2, background: on ? K.green : 'transparent' }} />
            <div style={{ fontSize: 30, fontWeight: on ? 600 : 500, color: on ? K.ink : K.gray, letterSpacing: '-0.015em' }}>{it}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Rangée de mots séparés par des points médians, qui apparaissent l'un après l'autre. */
export const Chips: React.FC<{ items: readonly string[]; at: number; step?: number; size?: number; color?: string; center?: boolean }> = ({
  items,
  at,
  step = sec(0.18),
  size = 28,
  color = K.gray,
  center,
}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px 0',
        justifyContent: center ? 'center' : 'flex-start',
        fontFamily: DISPLAY,
        fontSize: size,
        fontWeight: 500,
        color,
      }}
    >
      {items.map((it, i) => {
        const k = tw(f, at + i * step, at + i * step + sec(0.7), 0, 1, EZ.out);
        return (
          <span key={it} style={{ opacity: k, transform: `translateY(${(1 - k) * 10}px)`, display: 'inline-block', whiteSpace: 'nowrap' }}>
            {i > 0 && <span style={{ color: K.dim, margin: '0 18px' }}>·</span>}
            {it}
          </span>
        );
      })}
    </div>
  );
};

export const useMeasure = (text: string, weight: number, size: number, tracking = 0) =>
  useMemo(() => measure(text, weight, size, tracking), [text, weight, size, tracking]);
