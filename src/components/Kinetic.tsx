import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { noise1, springAt } from '../lib/anim';
import { C, FONT } from '../theme';

/**
 * Mot qui claque sur le temps : scale 140 % → 100 % au spring, glitch RGB les premières images,
 * puis sortie rapide (scale up + flou) à `out`.
 */
export const Slam: React.FC<{
  text: string;
  at: number;
  out?: number;
  size?: number;
  color?: string;
  /** Décalage vertical en fraction de la hauteur (-0,5 haut → 0,5 bas). */
  y?: number;
  /** Décalage horizontal en fraction de la largeur. */
  x?: number;
  glow?: string;
  weight?: number;
  tracking?: number;
  align?: 'center' | 'left' | 'right';
  stroke?: boolean;
}> = ({
  text,
  at,
  out,
  size = 150,
  color = C.white,
  y = 0,
  x = 0,
  glow = 'rgba(242,192,64,0.55)',
  weight = 900,
  tracking = -0.03,
  align = 'center',
  stroke = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  if (frame < at || (out !== undefined && frame > out + 8)) return null;
  const s = springAt(frame, fps, at, { damping: 11, stiffness: 260, mass: 0.5 });
  let scale = interpolate(s, [0, 1], [1.4, 1]);
  let opacity = Math.min(1, (frame - at + 1) / 2);
  let blur = 0;
  if (out !== undefined && frame > out) {
    const k = (frame - out) / 8;
    scale *= 1 + k * 0.5;
    opacity *= 1 - k;
    blur = k * 14;
  }
  // Glitch RGB : fort à l'impact, puis petits sursauts pseudo-aléatoires.
  const age = frame - at;
  const g = Math.max(0, 1 - age / 7) * 14 + (noise1(frame * 0.9, at) > 0.82 ? 6 : 0);
  const jx = g ? noise1(frame * 2.3, at + 1) * g * 0.6 : 0;
  const fontSize = Math.min(size * u, (width * 0.9) / Math.max(1, text.length * 0.62));
  const common: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: weight,
    fontSize,
    letterSpacing: `${tracking}em`,
    lineHeight: 0.95,
    whiteSpace: 'pre',
    textAlign: align,
    position: 'absolute',
  };
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end',
        transform: `translate(${x * width + jx}px, ${y * height}px) scale(${scale})`,
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'relative' }}>
        {g > 0.5 && (
          <>
            <div style={{ ...common, color: '#ff2a55', mixBlendMode: 'screen', transform: `translate(${-g}px, 0)`, opacity: 0.85 }}>
              {text}
            </div>
            <div style={{ ...common, color: '#19e6ff', mixBlendMode: 'screen', transform: `translate(${g}px, 0)`, opacity: 0.85 }}>
              {text}
            </div>
          </>
        )}
        <div
          style={{
            ...common,
            position: 'relative',
            color: stroke ? 'transparent' : color,
            WebkitTextStroke: stroke ? `3px ${color}` : undefined,
            textShadow: `0 0 40px ${glow}, 0 6px 0 rgba(0,0,0,0.35)`,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Flash plein écran (blanc par défaut) qui décroît en `len` images. */
export const Flash: React.FC<{ at: number; len?: number; color?: string; peak?: number }> = ({ at, len = 8, color = '#fff', peak = 1 }) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > at + len) return null;
  const o = peak * Math.pow(1 - (frame - at) / len, 2);
  return <AbsoluteFill style={{ background: color, opacity: o, pointerEvents: 'none' }} />;
};

/** Petit libellé (sous-titre, étiquette). */
export const Label: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: FONT, fontWeight: 800, color: C.white, letterSpacing: '0.02em', ...style }}>{children}</div>
);
