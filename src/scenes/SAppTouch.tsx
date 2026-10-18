import React, { useMemo } from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Flash, Slam } from '../components/Kinetic';
import { Coin, GoldDust } from '../components/props3d';
import { Cam, Stage } from '../components/Stage';
import { Finger, TouchKey } from '../components/Touch';
import { COPY } from '../copy';
import { bf, clamp01, EASE, lerp, noise1, rng, springAt, tween, useIsPortrait, useUnit } from '../lib/anim';
import { C, FONT } from '../theme';

// Écrans dessinés en points iPhone (390 × 844), puis mis à l'échelle dans le téléphone.
const W = 390;
const H = 844;
const APP = {
  bg: '#FFFFFF',
  surface: '#F6F6F8',
  ink: '#0B0B0D',
  ink2: '#5F6168',
  line: '#E7E7EC',
  pos: '#15935A',
  posSoft: '#E7F6EE',
  neg: '#D23B3B',
};

const T = {
  enter: 0,
  tapAnswer: bf(1),
  tapContinue: bf(2),
  toMarket: bf(2.15),
  scrubStart: bf(2.75),
  scrubEnd: bf(3.75),
  tapBuy: bf(4.25),
  tabStart: bf(5),
  tabEnd: bf(5.75),
  flickStart: bf(6.6),
  flick: bf(7),
  end: bf(8),
};

const screenIndex = (f: number) => (f < T.toMarket ? 0 : f < T.tabStart + 18 ? 1 : 2);

const cam = (f: number): Cam => ({ pos: [Math.sin(f * 0.01) * 1.2, 0.3, 9 - f * 0.01], target: [0, 0, -4], fov: 50 });

// ------------------------------------------------------------------ écran 1 : leçon

const Lesson: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const picked = f >= T.tapAnswer;
  const ok = springAt(f, fps, T.tapAnswer + 3, { damping: 12, stiffness: 240 });
  const choices = ['Elles montent', 'Elles baissent', 'Rien ne bouge'];
  const press = (at: number) => (f >= at - 3 && f < at + 4 ? 0.95 : 1);
  return (
    <div style={{ position: 'absolute', inset: 0, background: APP.bg, padding: '62px 22px 0', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 22, color: APP.ink2, fontWeight: 700 }}>✕</div>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: APP.line, overflow: 'hidden' }}>
          <div style={{ width: `${lerp(55, 75, ok)}%`, height: '100%', background: APP.ink, borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ marginTop: 34, fontSize: 13, fontWeight: 700, color: APP.ink2, letterSpacing: '0.08em' }}>QUESTION 3 / 5</div>
      <div style={{ marginTop: 10, fontSize: 27, fontWeight: 800, color: APP.ink, lineHeight: 1.18 }}>
        La banque centrale monte ses taux. Les obligations…
      </div>
      <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {choices.map((c, i) => {
          const good = i === 1;
          const on = picked && good;
          return (
            <div
              key={c}
              style={{
                padding: '18px 18px',
                borderRadius: 16,
                border: `2px solid ${on ? APP.pos : APP.line}`,
                background: on ? APP.posSoft : APP.bg,
                fontSize: 19,
                fontWeight: 700,
                color: on ? APP.pos : APP.ink,
                transform: `scale(${good ? press(T.tapAnswer) : 1})`,
                display: 'flex',
                justifyContent: 'space-between',
                opacity: picked && !good ? 0.45 : 1,
              }}
            >
              {c}
              {on && <span style={{ transform: `scale(${ok})` }}>✓</span>}
            </div>
          );
        })}
      </div>
      {picked && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '22px 22px 40px',
            background: APP.posSoft,
            transform: `translateY(${(1 - ok) * 100}%)`,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: APP.pos }}>Bien joué ! +10 XP</div>
          <div
            style={{
              marginTop: 14,
              padding: '17px 0',
              borderRadius: 16,
              background: APP.ink,
              color: '#fff',
              textAlign: 'center',
              fontSize: 18,
              fontWeight: 800,
              transform: `scale(${press(T.tapContinue)})`,
            }}
          >
            Continuer
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ écran 2 : marché (graphique + achat)

const CANDLES = (() => {
  const r = rng(404);
  let v = 0.5;
  const raw = Array.from({ length: 22 }, () => {
    const o = v;
    v += (r() - 0.4) * 0.12;
    return { o, c: v, h: Math.max(o, v) + r() * 0.04, l: Math.min(o, v) - r() * 0.04 };
  });
  // Recadre la série pour qu'elle occupe toute la hauteur du graphique.
  const lo = Math.min(...raw.map((k) => k.l));
  const hi = Math.max(...raw.map((k) => k.h));
  const n = (x: number) => 0.06 + ((x - lo) / (hi - lo)) * 0.88;
  return raw.map((k) => ({ o: n(k.o), c: n(k.c), h: n(k.h), l: n(k.l) }));
})();

const Market: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const chart = { x: 22, y: 170, w: 346, h: 400 };
  const cw = chart.w / CANDLES.length;
  const scrub = f >= T.scrubStart && f <= T.scrubEnd + 6;
  const sx = tween(f, T.scrubStart, T.scrubEnd, 0.3, 0.86, EASE.inOut);
  const ci = Math.min(CANDLES.length - 1, Math.floor(sx * CANDLES.length));
  const bought = f >= T.tapBuy;
  const toast = springAt(f, fps, T.tapBuy + 2, { damping: 13, stiffness: 220 });
  const press = f >= T.tapBuy - 3 && f < T.tapBuy + 4 ? 0.94 : 1;
  const y = (v: number) => chart.y + chart.h * (1 - v);
  return (
    <div style={{ position: 'absolute', inset: 0, background: APP.bg, fontFamily: FONT }}>
      <div style={{ padding: '62px 22px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: APP.ink2, letterSpacing: '0.08em' }}>MARCHÉS · SIMULATION</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: APP.ink }}>Or</div>
      </div>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {CANDLES.map((k, i) => {
          const up = k.c >= k.o;
          const col = up ? APP.pos : APP.neg;
          const x = chart.x + i * cw + cw / 2;
          const active = scrub && i === ci;
          return (
            <g key={i} opacity={scrub && !active ? 0.55 : 1}>
              <line x1={x} x2={x} y1={y(k.h)} y2={y(k.l)} stroke={col} strokeWidth={1.5} />
              <rect
                x={x - cw * 0.32}
                width={cw * 0.64}
                y={y(Math.max(k.o, k.c))}
                height={Math.max(2, Math.abs(y(k.o) - y(k.c)))}
                fill={col}
                rx={2}
              />
            </g>
          );
        })}
        {scrub && (
          <>
            <line
              x1={chart.x + ci * cw + cw / 2}
              x2={chart.x + ci * cw + cw / 2}
              y1={chart.y - 10}
              y2={chart.y + chart.h}
              stroke={APP.ink}
              strokeWidth={1.2}
              strokeDasharray="4 4"
            />
            <line
              x1={chart.x}
              x2={chart.x + chart.w}
              y1={y(CANDLES[ci].c)}
              y2={y(CANDLES[ci].c)}
              stroke={APP.ink}
              strokeWidth={1.2}
              strokeDasharray="4 4"
            />
          </>
        )}
      </svg>
      {scrub && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(210, chart.x + ci * cw - 40),
            top: chart.y - 52,
            padding: '6px 12px',
            borderRadius: 10,
            background: APP.ink,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {CANDLES[ci].c >= CANDLES[ci].o ? 'Bougie haussière' : 'Bougie baissière'}
        </div>
      )}
      <div style={{ position: 'absolute', left: 22, right: 22, top: 620, display: 'flex', gap: 12 }}>
        <div
          style={{
            flex: 1,
            padding: '18px 0',
            borderRadius: 16,
            border: `2px solid ${APP.neg}`,
            color: APP.neg,
            textAlign: 'center',
            fontSize: 19,
            fontWeight: 800,
          }}
        >
          Vendre
        </div>
        <div
          style={{
            flex: 1,
            padding: '18px 0',
            borderRadius: 16,
            background: APP.pos,
            color: '#fff',
            textAlign: 'center',
            fontSize: 19,
            fontWeight: 800,
            transform: `scale(${press})`,
            boxShadow: bought ? `0 0 ${30 * (1 - clamp01((f - T.tapBuy) / 20))}px ${APP.pos}` : 'none',
          }}
        >
          Acheter
        </div>
      </div>
      <div style={{ position: 'absolute', left: 22, right: 22, top: 700, fontSize: 13, color: APP.ink2, textAlign: 'center' }}>
        Argent fictif
      </div>
      {bought && (
        <div
          style={{
            position: 'absolute',
            left: 22,
            right: 22,
            top: 70,
            padding: '16px 18px',
            borderRadius: 18,
            background: APP.ink,
            color: '#fff',
            fontSize: 17,
            fontWeight: 800,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            transform: `translateY(${(1 - toast) * -140}px)`,
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          }}
        >
          <span style={{ color: '#3ddc84' }}>●</span> Ordre exécuté
        </div>
      )}
      {/* Pièces qui jaillissent du bouton. */}
      {bought &&
        Array.from({ length: 12 }, (_, i) => {
          const r = rng(70 + i);
          const t = (f - T.tapBuy) / 30;
          if (t > 1) return null;
          const a = -Math.PI / 2 + (r() - 0.5) * 2.2;
          const sp = 160 + r() * 140;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 290 + Math.cos(a) * sp * t,
                top: 645 + Math.sin(a) * sp * t + 260 * t * t,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, #fff3b0, #f2c040 45%, #a8780f)',
                opacity: 1 - t,
              }}
            />
          );
        })}
    </div>
  );
};

// ------------------------------------------------------------------ écran 3 : carrière + tab bar

const TABS = ['Accueil', 'Parcours', 'Marchés', 'Carrière'];

const Career: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const s = springAt(f, fps, T.tabEnd - 4, { damping: 12 });
  return (
    <div style={{ position: 'absolute', inset: 0, background: APP.bg, padding: '62px 22px 0', fontFamily: FONT }}>
      <div style={{ fontSize: 34, fontWeight: 900, color: APP.ink }}>Carrière</div>
      <div style={{ marginTop: 18, borderRadius: 22, background: APP.surface, height: 470, position: 'relative', overflow: 'hidden' }}>
        <Img
          src={staticFile('assets/characters/man-blazer.png')}
          style={{ position: 'absolute', left: '50%', bottom: 70, height: 360, transform: `translateX(-50%) scale(${lerp(0.9, 1, s)})` }}
        />
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: APP.ink2, letterSpacing: '0.08em' }}>GRADE</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: APP.ink }}>Associate</div>
          <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: APP.line }}>
            <div style={{ width: `${lerp(30, 68, s)}%`, height: '100%', borderRadius: 4, background: APP.ink }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const TabBar: React.FC<{ active: number }> = ({ active }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 92,
      background: APP.bg,
      borderTop: `1px solid ${APP.line}`,
      display: 'flex',
      fontFamily: FONT,
    }}
  >
    {TABS.map((t, i) => {
      const on = Math.round(active) === i;
      return (
        <div key={t} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 5 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: i === 0 ? 6 : i === 1 ? 12 : 4,
              border: `2.5px solid ${on ? APP.ink : APP.ink2}`,
              transform: `translateY(${on ? -2 : 0}px) scale(${on ? 1.06 : 1})`,
            }}
          />
          <div style={{ fontSize: 11, fontWeight: 700, color: on ? APP.ink : APP.ink2 }}>{t}</div>
        </div>
      );
    })}
    <div
      style={{
        position: 'absolute',
        bottom: 14,
        left: `${((active + 0.5) / TABS.length) * 100}%`,
        width: 6,
        height: 6,
        marginLeft: -3,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #e9edf5, #8b93a5)',
        boxShadow: '0 0 4px rgba(0,0,0,0.3)',
      }}
    />
  </div>
);

// ------------------------------------------------------------------ téléphone

const tabX = (i: number) => ((i + 0.5) / TABS.length) * W;
const FINGER: TouchKey[] = [
  { f: T.tapAnswer - 14, x: 300, y: 560 },
  { f: T.tapAnswer - 2, x: 200, y: 386 },
  { f: T.tapAnswer, x: 200, y: 386, down: true },
  { f: T.tapAnswer + 5, x: 200, y: 386, down: true },
  { f: T.tapAnswer + 6, x: 200, y: 392 },
  { f: T.tapContinue - 3, x: 195, y: 760 },
  { f: T.tapContinue, x: 195, y: 760, down: true },
  { f: T.tapContinue + 5, x: 195, y: 760, down: true },
  { f: T.tapContinue + 8, x: 210, y: 700 },
  { f: T.scrubStart - 2, x: 125, y: 420 },
  { f: T.scrubStart, x: 125, y: 420, down: true },
  { f: T.scrubEnd, x: 320, y: 380, down: true },
  { f: T.scrubEnd + 2, x: 320, y: 384 },
  { f: T.tapBuy - 3, x: 290, y: 645 },
  { f: T.tapBuy, x: 290, y: 645, down: true },
  { f: T.tapBuy + 5, x: 290, y: 645, down: true },
  { f: T.tabStart - 4, x: tabX(2), y: 800 },
  { f: T.tabStart, x: tabX(2), y: 800, down: true },
  { f: T.tabEnd, x: tabX(3), y: 800, down: true },
  { f: T.tabEnd + 2, x: tabX(3), y: 790 },
  { f: T.flickStart - 2, x: 195, y: 640 },
  { f: T.flickStart, x: 195, y: 640, down: true },
  { f: T.flick, x: 200, y: 260, down: true },
  { f: T.flick + 2, x: 200, y: 240 },
];

const Phone: React.FC<{ f: number; width: number }> = ({ f, width }) => {
  const k = width / W;
  const idx = screenIndex(f);
  // Glissement entre écrans (navigation poussée) et sélection animée dans la tab bar.
  const slide1 = tween(f, T.toMarket, T.toMarket + 12, 0, 1, EASE.inOut);
  const slide2 = tween(f, T.tabEnd - 6, T.tabEnd + 6, 0, 1, EASE.inOut);
  const active = idx === 2 ? 3 : idx === 1 ? (f >= T.tabStart ? lerp(2, 3, tween(f, T.tabStart, T.tabEnd, 0, 1, EASE.inOut)) : 2) : 1;
  return (
    <div
      style={{
        width: width + 28 * k,
        height: (H + 28) * k,
        borderRadius: 62 * k,
        background: 'linear-gradient(145deg, #3a3d46, #0e0f13 40%, #2a2c33)',
        padding: 14 * k,
        boxSizing: 'border-box',
        boxShadow: `0 ${40 * k}px ${90 * k}px rgba(0,0,0,0.6), inset 0 0 ${3 * k}px rgba(255,255,255,0.4)`,
      }}
    >
      <div style={{ width, height: H * k, borderRadius: 48 * k, overflow: 'hidden', position: 'relative', background: '#fff' }}>
        <div
          style={{ width: W, height: H, transform: `scale(${k})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden' }}
        >
          {idx === 0 || slide1 < 1 ? (
            <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-slide1 * 30}%)` }}>
              <Lesson f={f} />
            </div>
          ) : null}
          {f >= T.toMarket && slide2 < 1 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translateX(${(1 - slide1) * 100 - slide2 * 30}%)`,
                boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
              }}
            >
              <Market f={f} />
            </div>
          )}
          {slide2 > 0 && (
            <div style={{ position: 'absolute', inset: 0, transform: `translateX(${(1 - slide2) * 100}%)` }}>
              <Career f={f} />
            </div>
          )}
          {f >= T.toMarket && <TabBar active={active} />}
          {/* Barre d'état + île. */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              width: 120,
              height: 34,
              marginLeft: -60,
              borderRadius: 17,
              background: '#000',
            }}
          />
          <div style={{ position: 'absolute', top: 18, left: 32, fontFamily: FONT, fontWeight: 800, fontSize: 16, color: APP.ink }}>
            9:41
          </div>
          <Finger keys={FINGER} size={62} />
        </div>
      </div>
    </div>
  );
};

export const SAppTouch: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = useUnit();
  const portrait = useIsPortrait();
  const phoneW = (portrait ? 560 : 380) * u;
  const enter = tween(f, 0, 14, 0, 1, EASE.out);
  const exit = tween(f, T.flick, T.end, 0, 1, EASE.in);
  // Petit « recul » du téléphone à chaque appui, comme un retour haptique.
  const haptic = [T.tapAnswer, T.tapContinue, T.tapBuy, T.tabEnd].reduce((a, h) => a + (f >= h ? Math.exp(-(f - h) / 4) * 0.025 : 0), 0);
  const rotY = lerp(-22, 16, tween(f, 0, T.flick, 0, 1, EASE.inOut)) + noise1(f * 0.03, 2) * 3;
  const rotX = 8 + noise1(f * 0.025, 5) * 3 - exit * 30;
  const coins = useMemo(() => {
    const r = rng(51);
    return Array.from({ length: 14 }, () => ({ x: (r() - 0.5) * 10, y: (r() - 0.5) * 12, z: -3 - r() * 8, ph: r() * 6 }));
  }, []);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage cam={cam} bloom={0.9} fog={[6, 20]} motionBlur={0.5}>
        {coins.map((c, i) => (
          <Coin key={i} position={[c.x, c.y + Math.sin(f * 0.02 + c.ph) * 0.4, c.z]} rotation={[f * 0.03 + c.ph, c.ph, 0]} scale={0.35} />
        ))}
        <GoldDust frame={f} count={220} spread={[14, 12, 12]} center={[0, 0, -5]} />
      </Stage>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(80,110,255,0.18), rgba(4,6,13,0) 60%)' }} />
      <AbsoluteFill style={{ perspective: 2000 * u, alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            transform: `translateX(${(1 - enter) * width * 0.9 + (portrait ? 0 : width * 0.16)}px) translateY(${-exit * height * 1.3 + (portrait ? 40 * u : 0)}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${1 - haptic})`,
            filter: enter < 1 ? `blur(${(1 - enter) * 12}px)` : exit > 0 ? `blur(${exit * 16}px)` : undefined,
          }}
        >
          <Phone f={f} width={phoneW} />
        </div>
      </AbsoluteFill>
      <Slam text={COPY.app[0]} at={T.tapAnswer} out={T.scrubStart - 6} y={portrait ? -0.42 : -0.05} x={portrait ? 0 : -0.24} size={130} />
      <Slam
        text={COPY.app[1]}
        at={T.scrubStart}
        out={T.tapBuy - 4}
        y={portrait ? -0.42 : -0.05}
        x={portrait ? 0 : -0.24}
        size={130}
        color={C.goldHot}
        glow="rgba(255,190,60,0.9)"
        variant="mask"
      />
      <Slam
        text={COPY.app[2]}
        at={T.tapBuy}
        out={T.flick}
        y={portrait ? -0.42 : -0.05}
        x={portrait ? 0 : -0.24}
        size={130}
        color={C.green}
        glow="rgba(34,224,122,0.85)"
        variant="split"
      />
      <Flash at={0} len={6} peak={0.5} />
      <AbsoluteFill
        style={{
          background: '#fff',
          opacity: interpolate(f, [T.end - 3, T.end], [0, 0.7], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      />
    </AbsoluteFill>
  );
};
