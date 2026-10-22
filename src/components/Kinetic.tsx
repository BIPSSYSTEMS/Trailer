import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { noise1, springAt } from '../lib/anim';
import { C, FONT } from '../theme';

export type TextVariant = 'slam' | 'stagger' | 'split' | 'mask';

/**
 * Texte cinétique calé sur le temps. Quatre entrées possibles :
 * - slam : scale 140 % → 100 % au spring + glitch RGB (impacts sur le temps) ;
 * - stagger : les lettres montent une à une derrière un masque, avec une légère rotation ;
 * - split : les moitiés haute et basse du mot glissent en sens opposé puis se verrouillent ;
 * - mask : révélation de gauche à droite par une barre lumineuse.
 * Sortie à `out` (chacune la sienne : flou, lettres qui s'envolent, moitiés qui repartent, balayage).
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
  /** Largeur maximale du texte, en fraction de la largeur de l'image. */
  maxWidth?: number;
  variant?: TextVariant;
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
  maxWidth = 0.9,
  variant = 'slam',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  // En paysage, la hauteur utile est plus courte : textes un peu plus petits.
  const u = (Math.min(width, height) / 1080) * (width > height ? 0.8 : 1);
  const exitLen = variant === 'slam' ? 8 : 14;
  if (frame < at || (out !== undefined && frame > out + exitLen)) return null;
  if (variant !== 'slam') {
    return (
      <Fancy
        text={text}
        at={at}
        out={out}
        variant={variant}
        fontSize={Math.min(size * u, (width * maxWidth) / Math.max(1, text.length * 0.62))}
        color={color}
        glow={glow}
        weight={weight}
        tracking={tracking}
        tx={x * width}
        ty={y * height}
        stroke={stroke}
      />
    );
  }
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
  const g = Math.max(0, 1 - age / 7) * 14 + (noise1(frame * 0.9, at) > 0.93 ? 5 : 0);
  const jx = g ? noise1(frame * 2.3, at + 1) * g * 0.6 : 0;
  const fontSize = Math.min(size * u, (width * maxWidth) / Math.max(1, text.length * 0.62));
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

const Fancy: React.FC<{
  text: string;
  at: number;
  out?: number;
  variant: Exclude<TextVariant, 'slam'>;
  fontSize: number;
  color: string;
  glow: string;
  weight: number;
  tracking: number;
  tx: number;
  ty: number;
  stroke: boolean;
}> = ({ text, at, out, variant, fontSize, color, glow, weight, tracking, tx, ty, stroke }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const leaving = out !== undefined && frame > out;
  const style: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: weight,
    fontSize,
    letterSpacing: `${tracking}em`,
    lineHeight: 1,
    whiteSpace: 'pre',
    color: stroke ? 'transparent' : color,
    WebkitTextStroke: stroke ? `3px ${color}` : undefined,
    textShadow: `0 0 40px ${glow}, 0 6px 0 rgba(0,0,0,0.35)`,
  };
  let body: React.ReactNode;
  if (variant === 'stagger') {
    const chars = [...text];
    body = (
      <div style={{ display: 'flex', clipPath: leaving ? undefined : 'inset(-60% -20% 0 -20%)', paddingBottom: fontSize * 0.08 }}>
        {chars.map((ch, i) => {
          const sp = springAt(frame, fps, at + i * 1.6, { damping: 14, stiffness: 210, mass: 0.6 });
          const ex = leaving
            ? interpolate(frame - (out as number) - i * 0.8, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            : 0;
          return (
            <span
              key={i}
              style={{
                ...style,
                display: 'inline-block',
                transform: `translateY(${(1 - sp) * 1.05 - ex * 0.9}em) rotate(${(1 - sp) * 14 - ex * 8}deg)`,
                opacity: (sp > 0.01 ? 1 : 0) * (1 - ex),
                filter: ex > 0 ? `blur(${ex * 10}px)` : undefined,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
    );
  } else if (variant === 'split') {
    const sp = springAt(frame, fps, at, { damping: 15, stiffness: 170, mass: 0.6 });
    const ex = leaving ? interpolate(frame - (out as number), [0, 12], [0, 1], { extrapolateRight: 'clamp', easing: (t) => t * t }) : 0;
    const off = (1 - sp) * width * 0.7 + ex * width;
    const half = (top: boolean) => (
      <div
        style={{
          ...style,
          position: top ? 'relative' : 'absolute',
          inset: top ? undefined : 0,
          clipPath: top ? 'inset(-50% -10% 50% -10%)' : 'inset(50% -10% -50% -10%)',
          transform: `translateX(${top ? -off : off}px) skewX(${(top ? -1 : 1) * (1 - sp) * 20}deg)`,
        }}
      >
        {text}
      </div>
    );
    body = (
      <div style={{ position: 'relative', opacity: 1 - ex * 0.6 }}>
        {half(true)}
        {half(false)}
        <div
          style={{
            position: 'absolute',
            left: '-5%',
            right: '-5%',
            top: '50%',
            height: Math.max(2, fontSize * 0.025),
            background: color,
            boxShadow: `0 0 20px ${glow}`,
            transform: `scaleX(${Math.max(0, 1 - sp) * 1.2})`,
            opacity: 1 - sp,
          }}
        />
      </div>
    );
  } else {
    const rev = interpolate(frame - at, [0, 12], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
    const ex = leaving ? interpolate(frame - (out as number), [0, 12], [0, 1], { extrapolateRight: 'clamp', easing: (t) => t * t }) : 0;
    body = (
      <div style={{ position: 'relative' }}>
        <div style={{ ...style, clipPath: `inset(-40% ${(1 - rev) * 100}% -40% ${ex * 100}%)` }}>{text}</div>
        {(rev < 1 || ex > 0) && (
          <div
            style={{
              position: 'absolute',
              top: '-15%',
              bottom: '-15%',
              left: `${(ex > 0 ? ex : rev) * 100}%`,
              width: fontSize * 0.08,
              marginLeft: -fontSize * 0.04,
              background: `linear-gradient(${color}, #fff, ${color})`,
              boxShadow: `0 0 ${fontSize * 0.3}px ${glow}, 0 0 ${fontSize * 0.1}px #fff`,
            }}
          />
        )}
      </div>
    );
  }
  return (
    <AbsoluteFill
      style={{ justifyContent: 'center', alignItems: 'center', transform: `translate(${tx}px, ${ty}px)`, pointerEvents: 'none' }}
    >
      {body}
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
