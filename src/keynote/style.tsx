import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';

/** Palette minimaliste : noir, blanc, gris, un seul accent (le « point » vert de la marque). */
export const K = {
  bg: '#000000',
  tile: '#141416',
  tileLine: 'rgba(255,255,255,0.07)',
  ink: '#f5f5f7',
  gray: '#86868b',
  dim: '#48484d',
  green: '#30d158',
} as const;

export const DISPLAY = 'KDisplay';
export const TEXT = 'BipsInter';
export const FPS = 60;
export const sec = (s: number) => Math.round(s * FPS);

/** Courbes d'animation douces, façon keynote. */
export const EZ = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  soft: Easing.bezier(0.25, 0.1, 0.25, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
};

export const tw = (f: number, a: number, b: number, from: number, to: number, ease = EZ.inOut) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });

/** Valeur interpolée entre des clés [frame, valeur] (easing doux entre chaque paire). */
export const kf = (f: number, keys: [number, number][], ease = EZ.inOut) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i][0]) return tw(f, keys[i - 1][0], keys[i][0], keys[i - 1][1], keys[i][1], ease);
  }
  return keys[keys.length - 1][1];
};

/** Apparition (montée + net) et disparition (fondu + flou) d'un élément. */
export const Reveal: React.FC<{
  at: number;
  out?: number;
  dy?: number;
  blur?: number;
  dur?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, out, dy = 28, blur = 12, dur = sec(1), style, children }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const a = tw(f, at, at + dur, 0, 1, EZ.out);
  const b = out === undefined ? 1 : tw(f, out - sec(0.6), out, 1, 0, EZ.in);
  if (b <= 0) return null;
  const o = Math.min(a, b);
  const bl = (1 - a) * blur + (1 - b) * blur;
  return (
    <div style={{ opacity: o, transform: `translateY(${(1 - a) * dy}px)`, filter: bl > 0.2 ? `blur(${bl}px)` : undefined, ...style }}>
      {children}
    </div>
  );
};

export const Eyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = K.gray }) => (
  <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color, letterSpacing: '-0.005em' }}>{children}</div>
);

export const Headline: React.FC<{ children: React.ReactNode; size?: number; color?: string; align?: 'left' | 'center' }> = ({
  children,
  size = 84,
  color = K.ink,
  align = 'left',
}) => (
  <div
    style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: size, lineHeight: 1.04, letterSpacing: '-0.035em', color, textAlign: align }}
  >
    {children}
  </div>
);

export const Sub: React.FC<{ children: React.ReactNode; size?: number; color?: string; align?: 'left' | 'center' }> = ({
  children,
  size = 34,
  color = K.gray,
  align = 'left',
}) => (
  <div
    style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: size, lineHeight: 1.25, letterSpacing: '-0.015em', color, textAlign: align }}
  >
    {children}
  </div>
);

/** Chiffre clé : grand nombre blanc, légende grise dessous. */
export const Stat: React.FC<{ value: string; label: string; size?: number; accent?: boolean }> = ({ value, label, size = 96, accent }) => (
  <div>
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '-0.04em',
        color: accent ? K.green : K.ink,
      }}
    >
      {value}
    </div>
    <div style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 26, color: K.gray, marginTop: 12, letterSpacing: '-0.01em' }}>
      {label}
    </div>
  </div>
);
