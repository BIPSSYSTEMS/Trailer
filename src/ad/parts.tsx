import React, { useMemo } from 'react';
import { AbsoluteFill, spring, useCurrentFrame } from 'remotion';
import { TouchKey } from '../components/Touch';
import { Pose } from '../keynote/IPhone';
import { EZ, FPS, K, sec, TEXT, tw } from '../keynote/style';
import { Word, WORDS } from './words';

export const W = 1080;
export const H = 1920;
/** Hauteur de l'iPhone en points (écran 844 + bordure + cadre), pour cadrer un détail de l'écran. */
const DEV_H = 871;

/** Pose qui place le point (x, y) de l'écran (en pt) au point (X, Y) de l'image, téléphone de face. */
export const focus = (x: number, y: number, h: number, X = W / 2, Y = 860, extra: Partial<Pose> = {}): Pose => {
  const k = h / DEV_H;
  return { cx: X - (x - 195) * k, cy: Y - (y - 422) * k, h, ...extra };
};

/** Interpolation entre deux poses. */
export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const m = (u = 0, v = 0) => u + (v - u) * t;
  return {
    cx: m(a.cx, b.cx),
    cy: m(a.cy, b.cy),
    h: m(a.h, b.h),
    rotX: m(a.rotX, b.rotX),
    rotY: m(a.rotY, b.rotY),
    rotZ: m(a.rotZ, b.rotZ),
    opacity: m(a.opacity ?? 1, b.opacity ?? 1),
  };
};

/** Suite de poses clés [seconde, pose], easing doux entre chaque paire. */
export const posePath = (f: number, keys: [number, Pose][], ease = EZ.inOut): Pose => {
  const t = f / FPS;
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) return mixPose(keys[i - 1][1], keys[i][1], tw(t, keys[i - 1][0], keys[i][0], 0, 1, ease));
  }
  return keys[keys.length - 1][1];
};

/** Léger flottement « filmé à la main ». */
export const handheld = (p: Pose, f: number, amount = 1): Pose => ({
  ...p,
  cx: p.cx + Math.sin(f / 23) * 5 * amount,
  cy: p.cy + Math.cos(f / 29) * 6 * amount,
  rotY: (p.rotY ?? 0) + Math.sin(f / 41) * 1.6 * amount,
  rotX: (p.rotX ?? 0) + Math.cos(f / 53) * 1.2 * amount,
  rotZ: (p.rotZ ?? 0) + Math.sin(f / 37) * 0.6 * amount,
});

/** Doigt : arrive, touche (t en secondes, coordonnées en points de l'écran), repart. */
export const tap = (t: number, x: number, y: number): TouchKey[] => {
  const f = sec(t);
  return [
    { f: f - sec(0.35), x: x + 50, y: y + 120 },
    { f: f - sec(0.06), x, y },
    { f, x, y, down: true },
    { f: f + sec(0.12), x, y, down: true },
    { f: f + sec(0.35), x: x + 30, y: y + 80 },
  ];
};

/** Glissé horizontal (balayage d'une carte à l'autre). */
export const swipe = (t: number, x0: number, x1: number, y: number): TouchKey[] => {
  const f = sec(t);
  return [
    { f: f - sec(0.3), x: x0 + 30, y: y + 90 },
    { f: f - sec(0.05), x: x0, y },
    { f, x: x0, y, down: true },
    { f: f + sec(0.22), x: x1, y: y - 10, down: true },
    { f: f + sec(0.4), x: x1 - 20, y: y + 60 },
  ];
};

/** Largeur d'un texte (police déjà chargée au rendu). */
export const measureText = (text: string, weight: number, size: number, family = TEXT) => {
  if (typeof document === 'undefined') return text.length * size * 0.62;
  const c = document.createElement('canvas').getContext('2d')!;
  c.font = `${weight} ${size}px ${family}`;
  return c.measureText(text).width;
};

/** Contour noir épais (ombres en anneau) : le texte reste lisible sur un écran clair comme sur le noir. */
export const outline = (r: number, color = '#000') => {
  const s: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    s.push(`${(Math.cos(a) * r).toFixed(1)}px ${(Math.sin(a) * r).toFixed(1)}px 0 ${color}`);
  }
  s.push(`0 ${r * 1.4}px ${r * 2.5}px rgba(0,0,0,0.55)`);
  return s.join(', ');
};

/** Apparition « pop » (ressort) à la frame `at`. */
export const usePop = (at: number, stiffness = 260, damping = 13) => {
  const f = useCurrentFrame();
  if (f < at) return 0;
  return spring({ frame: f - at, fps: FPS, config: { stiffness, damping, mass: 0.7 } });
};

// ------------------------------------------------------------------ sous-titres karaoké

type Page = { words: Word[]; t0: number; t1: number };

const paginate = (words: Word[]): Page[] => {
  const pages: Page[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) pages.push({ words: cur, t0: cur[0].t0, t1: cur[cur.length - 1].t1 });
    cur = [];
  };
  for (const w of words) {
    const len = cur.reduce((a, x) => a + x.text.length + 1, 0) + w.text.length;
    if (cur.length && (cur.length >= 3 || len > 17 || cur[0].line !== w.line || cur[0].sentence !== w.sentence)) flush();
    cur.push(w);
    if (w.last || /[,…]$/.test(w.text)) flush();
  }
  flush();
  // Chaque page reste jusqu'à la suivante (au plus 0,45 s après son dernier mot).
  pages.forEach((p, i) => {
    const next = pages[i + 1];
    p.t1 = Math.min(next ? next.t0 : p.t1 + 0.45, p.t1 + 0.45);
  });
  return pages;
};

/**
 * Sous-titres façon montage mobile : gros, gras, en capitales, contour noir, le mot prononcé en vert.
 * `skip(word)` écarte les mots déjà écrits en grand par une scène (accroche, logo, slogan).
 */
export const Captions: React.FC<{ skip: (w: Word) => boolean; y: (t: number) => number }> = ({ skip, y }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const pages = useMemo(() => paginate(WORDS.filter((w) => !skip(w))), [skip]);
  const page = pages.find((p) => t >= p.t0 - 0.02 && t < p.t1);
  if (!page) return null;
  const size = 88;
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: y(t),
        transform: 'translateY(-50%)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0 0.34em',
        fontFamily: TEXT,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: '-0.025em',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}
    >
      {page.words.map((w, i) => {
        const at = sec(w.t0);
        const k = f < at ? 0 : spring({ frame: f - at, fps: FPS, config: { stiffness: 380, damping: 16, mass: 0.6 } });
        const active = t >= w.t0 && t < w.t1 + 0.04;
        const shown = f >= at || i === 0;
        return (
          <span
            key={`${w.t0}`}
            style={{
              display: 'inline-block',
              color: active ? K.green : '#ffffff',
              textShadow: outline(7),
              opacity: shown ? 1 : 0,
              transform: `scale(${(0.55 + 0.45 * k) * (active ? 1.04 : 1)}) translateY(${(1 - k) * 18}px)`,
              whiteSpace: 'nowrap',
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------ stickers

export const Sticker: React.FC<{
  at: number;
  out?: number;
  x: number;
  y: number;
  rot?: number;
  bg?: string;
  color?: string;
  size?: number;
  children: React.ReactNode;
}> = ({ at, out, x, y, rot = -6, bg = K.green, color = '#000', size = 64, children }) => {
  const f = useCurrentFrame();
  const k = usePop(at);
  if (f < at || (out !== undefined && f > out)) return null;
  const leave = out === undefined ? 1 : tw(f, out - 6, out, 1, 0, EZ.in);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot + Math.sin(f / 9) * 1.2}deg) scale(${k * leave})`,
        background: bg,
        color,
        fontFamily: TEXT,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        padding: '0.24em 0.5em 0.28em',
        borderRadius: '0.38em',
        whiteSpace: 'nowrap',
        boxShadow: '0 16px 50px rgba(0,0,0,0.5), 0 0 0 4px rgba(0,0,0,0.85)',
      }}
    >
      {children}
    </div>
  );
};

// ------------------------------------------------------------------ fonds et effets

const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

/** Graphique en chandeliers qui part dans tous les sens (fond de l'accroche). */
export const CandleBg: React.FC<{ opacity?: number }> = ({ opacity = 0.2 }) => {
  const f = useCurrentFrame();
  const candles = useMemo(() => {
    const r = rng(42);
    let p = 0;
    return Array.from({ length: 70 }, () => {
      const o = p;
      p += (r() - 0.5) * 120 + Math.sin(p / 90) * 30;
      const hi = Math.max(o, p) + r() * 50;
      const lo = Math.min(o, p) - r() * 50;
      return { o, c: p, hi, lo };
    });
  }, []);
  const step = 34;
  const loop = candles.length * step;
  const jolt = f % 30 < 2 ? 14 : 0; // petite secousse sur chaque temps (le tic-tac)
  return (
    <AbsoluteFill style={{ opacity }}>
      <svg width={W} height={H} style={{ transform: `translateX(${jolt}px)` }}>
        {candles.map((c, i) => {
          const x = ((((i * step - f * 4) % loop) + loop) % loop) - step;
          const up = c.c >= c.o;
          const col = up ? K.green : '#ff453a';
          const cy = (v: number) => 960 - v;
          return (
            <g key={i}>
              <line x1={x + 10} x2={x + 10} y1={cy(c.hi)} y2={cy(c.lo)} stroke={col} strokeWidth={3} />
              <rect x={x} y={cy(Math.max(c.o, c.c))} width={20} height={Math.max(4, Math.abs(c.c - c.o))} fill={col} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Mille futurs : trajectoires qui jaillissent d'un point et filent hors de l'image. */
export const FutureBurst: React.FC<{ at: number; ox: number; oy: number; n?: number }> = ({ at, ox, oy, n = 150 }) => {
  const f = useCurrentFrame();
  const paths = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: n }, (_, i) => {
      const steps = 46;
      const len = 700 + r() * 500;
      const drift = (r() - 0.5) * 2.2;
      const vol = 6 + r() * 16;
      let y = 0;
      const pts: [number, number][] = [[0, 0]];
      let L = 0;
      for (let s = 1; s <= steps; s++) {
        const x = (s / steps) * len;
        y += drift * (len / steps) * 0.55 + (r() - 0.5) * vol * 2;
        const [px, py] = pts[pts.length - 1];
        L += Math.hypot(x - px, y - py);
        pts.push([x, y]);
      }
      const end = y;
      const color = end < -260 ? K.green : end > 260 ? '#ff453a' : i % 3 === 0 ? '#ffffff' : K.green;
      return { d: 'M' + pts.map(([x, yy]) => `${x.toFixed(1)},${yy.toFixed(1)}`).join('L'), L, delay: r() * 10, color, w: 1.5 + r() * 2 };
    });
  }, [n]);
  if (f < at) return null;
  const fade = tw(f, at + sec(1.2), at + sec(1.9), 1, 0, EZ.in);
  if (fade <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={W} height={H} overflow="visible">
        <g transform={`translate(${ox},${oy})`} style={{ filter: 'drop-shadow(0 0 6px rgba(48,209,88,0.5))' }}>
          {paths.map((p, i) => {
            const k = tw(f, at + p.delay, at + p.delay + sec(0.7), 0, 1, EZ.out);
            return (
              <path
                key={i}
                d={p.d}
                fill="none"
                stroke={p.color}
                strokeOpacity={0.55}
                strokeWidth={p.w}
                strokeDasharray={p.L}
                strokeDashoffset={p.L * (1 - k)}
              />
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Flash blanc bref (impacts et coupes). */
export const Flash: React.FC<{ at: number[]; strength?: number }> = ({ at, strength = 0.85 }) => {
  const f = useCurrentFrame();
  const o = at.reduce((a, t) => {
    const d = f - sec(t);
    return d >= 0 && d < 14 ? Math.max(a, strength * Math.exp(-d / 3)) : a;
  }, 0);
  if (o < 0.01) return null;
  return <AbsoluteFill style={{ background: '#fff', opacity: o, pointerEvents: 'none' }} />;
};
