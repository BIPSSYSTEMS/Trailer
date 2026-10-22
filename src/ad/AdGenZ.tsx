import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { Finger } from '../components/Touch';
import { IPhone, Pose, Shot } from '../keynote/IPhone';
import { BpsMark } from '../keynote/parts';
import { DISPLAY, EZ, FPS, K, sec, TEXT, tw } from '../keynote/style';
import {
  CandleBg,
  Captions,
  Flash,
  focus,
  FutureBurst,
  H,
  handheld,
  measureText,
  outline,
  posePath,
  Sticker,
  swipe,
  tap,
  usePop,
  W,
} from './parts';
import { AD, BEAT } from './timeline';
import { lineWords, Word, wordT } from './words';

/**
 * Pub Base Point pour le fil TikTok / Reels / Shorts (9:16, 30 s). Voir docs/prompt-pub-genz.md.
 * Tout est calé sur le temps absolu (secondes) : la voix (voix.json + minutage réel) et la musique à 120 BPM.
 */
export const AD_FRAMES = sec(AD.end);

/** Pose de base du téléphone : grand, centré, un peu haut (les sous-titres passent sur le bas de l'écran). */
const P0: Pose = { cx: 540, cy: 830, h: 1400 };
const CAPTION_Y = 1390;
const FINGER = 58;

// ------------------------------------------------------------------ montage

type Whip = 'left' | 'up' | 'zoom' | 'none';

/** Une scène visible de `from` à `to` (s), avec un « whip » flou à l'entrée et à la sortie. */
const Scene: React.FC<{ from: number; to: number; win?: Whip; wout?: Whip; children: React.ReactNode }> = ({
  from,
  to,
  win = 'left',
  wout = 'left',
  children,
}) => {
  const f = useCurrentFrame();
  const a = sec(from);
  const b = sec(to);
  if (f < a || f >= b) return null;
  const D = 8;
  const pi = win === 'none' ? 0 : tw(f, a, a + D, 1, 0, EZ.out);
  const po = wout === 'none' ? 0 : tw(f, b - D, b, 0, 1, EZ.in);
  let tx = 0;
  let ty = 0;
  let sc = 1;
  const move = (w: Whip, p: number, sign: number) => {
    if (w === 'left') tx += sign * p * W * 0.9;
    if (w === 'up') ty += sign * p * H * 0.55;
    if (w === 'zoom') sc *= sign > 0 ? 1 - p * 0.45 : 1 + p * 0.9;
  };
  move(win, pi, 1);
  move(wout, po, -1);
  const blur = (pi + po) * 34;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${tx}px, ${ty}px) scale(${sc})`,
        filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
        opacity: 1 - Math.max(pi, po) * 0.3,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Caméra globale : « punch » sur le premier temps de chaque mesure, secousse sur les impacts. */
const Camera: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  let punch = 0;
  for (let b = AD.normal; b < AD.end - 1; b += 4 * BEAT) {
    const d = f - sec(b);
    if (d >= 0 && d < 24) punch = Math.max(punch, 0.03 * Math.exp(-d / 5));
  }
  let amp = 0;
  for (const t of [AD.normal, AD.verite, AD.fin]) {
    const d = f - sec(t);
    if (d >= 0 && d < 30) amp = Math.max(amp, 24 * Math.exp(-d / 6));
  }
  const sx = Math.sin(f * 2.3) * amp;
  const sy = Math.cos(f * 3.1) * amp;
  return <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${1 + punch})` }}>{children}</AbsoluteFill>;
};

const Phone: React.FC<{ pose: Pose; shots: Shot[]; children?: React.ReactNode }> = ({ pose, shots, children }) => (
  <IPhone pose={pose} shots={shots} finish="black">
    {children}
  </IPhone>
);

// ------------------------------------------------------------------ 1. accroche

const HOOK_ROWS = [[0], [1, 2], [3], [4, 5]];

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const words = lineWords(0);
  const rows = useMemo(
    () =>
      HOOK_ROWS.map((idx) => {
        const text = idx.map((i) => words[i].text.toUpperCase()).join(' ');
        const size = Math.min(250, (100 * 930) / measureText(text, 900, 100));
        return { idx, size };
      }),
    [words],
  );
  const tick = 1 + 0.014 * Math.exp(-(f % 30) / 4);
  return (
    <AbsoluteFill>
      <CandleBg opacity={0.32} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 48%, rgba(0,0,0,0.75), rgba(0,0,0,0.2))' }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${tick})` }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -60 }}>
          {rows.map(({ idx, size }, r) => (
            <div
              key={r}
              style={{
                display: 'flex',
                gap: '0 0.22em',
                fontFamily: TEXT,
                fontWeight: 900,
                fontSize: size,
                lineHeight: 0.9,
                letterSpacing: '-0.035em',
                whiteSpace: 'nowrap',
              }}
            >
              {idx.map((i) => (
                <HookWord key={i} w={words[i]} accent={i === 5} />
              ))}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const HookWord: React.FC<{ w: Word; accent?: boolean }> = ({ w, accent }) => {
  // Le premier mot est déjà posé sur la première image (elle sert souvent de couverture sur le fil).
  const at = w.t0 < 0.5 ? -12 : sec(w.t0) - 2;
  const k = usePop(at, 420, 15);
  const f = useCurrentFrame();
  return (
    <span
      style={{
        display: 'inline-block',
        color: accent ? K.green : K.ink,
        opacity: f >= at ? 1 : 0,
        transform: `scale(${0.4 + 0.6 * k}) rotate(${(1 - k) * -8}deg)`,
        filter: k < 0.6 ? `blur(${(0.6 - k) * 20}px)` : undefined,
      }}
    >
      {w.text.toUpperCase()}
    </span>
  );
};

// ------------------------------------------------------------------ 2. « Normal. » → l'app

const Normal: React.FC = () => {
  const f = useCurrentFrame();
  const tN = wordT(1, 'Normal');
  const k = usePop(sec(tN), 300, 12);
  const spinA = sec(2.72);
  const spinB = sec(3.42);
  const away = tw(f, spinA - 4, spinA + 10, 0, 1, EZ.in);
  const s = tw(f, spinA, spinB, 0, 1, EZ.out);
  const pose = handheld(
    {
      cx: 540,
      cy: 1500 - (1500 - P0.cy) * s,
      h: 800 + (P0.h - 800) * s,
      rotY: -400 * (1 - s) - 6,
      rotX: 18 * (1 - s) + 2,
      rotZ: -14 * (1 - s),
      opacity: tw(f, spinA, spinA + 6, 0, 1),
    },
    f,
  );
  const tBase = wordT(1, 'Base');
  return (
    <AbsoluteFill>
      {f >= spinA && <Phone pose={pose} shots={[{ src: 'home-dark', at: 0 }]} />}
      {away < 1 && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              fontFamily: TEXT,
              fontWeight: 900,
              fontSize: 230,
              letterSpacing: '-0.04em',
              color: K.ink,
              transform: `translateY(${-away * 700}px) scale(${(0.5 + 0.5 * k) * (1 - away * 0.4)}) rotate(${Math.sin(f / 5) * 2 * (1 - away)}deg)`,
              opacity: (f >= sec(tN) ? 1 : 0) * (1 - away),
              filter: away > 0.05 ? `blur(${away * 24}px)` : undefined,
            }}
          >
            Normal.
          </div>
        </AbsoluteFill>
      )}
      <Sticker at={sec(tBase)} x={540} y={300} rot={-4} bg="#ffffff" size={90}>
        <BpsMark size={90} color="#000" />
      </Sticker>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 3. leçons, quiz, niveau

const XpCard: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const k = usePop(at);
  if (f < at) return null;
  const fill = tw(f, at + 6, at + sec(0.6), 0.55, 1, EZ.out);
  const done = f >= at + sec(0.6);
  return (
    <div
      style={{
        position: 'absolute',
        left: 540,
        top: 1150,
        transform: `translate(-50%, -50%) rotate(-3deg) scale(${k * (done ? 1 + 0.06 * Math.exp(-(f - at - sec(0.6)) / 4) : 1)})`,
        width: 700,
        padding: '26px 34px 30px',
        borderRadius: 34,
        background: '#0b0b0c',
        boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 0 4px rgba(255,255,255,0.12)',
        fontFamily: TEXT,
        color: K.ink,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 40, letterSpacing: '-0.02em' }}>
        <span>NIV. 8</span>
        <span style={{ color: done ? K.green : K.gray }}>NIV. 9</span>
      </div>
      <div style={{ marginTop: 18, height: 26, borderRadius: 13, background: '#2a2a2e', overflow: 'hidden' }}>
        <div style={{ width: `${fill * 100}%`, height: '100%', borderRadius: 13, background: K.green }} />
      </div>
    </div>
  );
};

const Lecons: React.FC = () => {
  const f = useCurrentFrame();
  const tLecons = wordT(2, 'leçons');
  const tMinutes = wordT(2, 'minutes');
  const tQuiz = wordT(2, 'Un');
  const tAnswer = wordT(2, 'quiz') + 0.42;
  const tNiveau = wordT(2, 'Et');
  const shots: Shot[] = [
    { src: 'parcours', at: sec(AD.lecons) },
    { src: 'lecon-concept', at: sec(tLecons + 0.08), mode: 'push', dur: 14 },
    { src: 'lecon-courbe', at: sec(tMinutes + 0.06), mode: 'push', dur: 14 },
    { src: 'lecon-quiz', at: sec(tQuiz - 0.1), mode: 'push', dur: 14 },
    { src: 'lecon-quiz-choix', at: sec(tAnswer + 0.05), mode: 'fade', dur: 6 },
  ];
  const pose = handheld(
    posePath(f, [
      [AD.lecons, { ...P0, rotY: -10, rotZ: -2 }],
      [tQuiz, { ...P0, rotY: 6, rotZ: 1 }],
      [AD.trading, { ...P0, cy: P0.cy - 20, rotY: -4, rotZ: 0 }],
    ]),
    f,
  );
  return (
    <AbsoluteFill>
      <Phone pose={pose} shots={shots}>
        <Finger keys={tap(tLecons, 190, 365)} size={FINGER} />
        <Finger keys={swipe(tMinutes - 0.1, 320, 70, 520)} size={FINGER} />
        <Finger keys={tap(tAnswer, 190, 258)} size={FINGER} />
      </Phone>
      <Sticker at={sec(tAnswer + 0.08)} x={800} y={420} rot={8} size={70}>
        VU JUSTE
      </Sticker>
      <XpCard at={sec(tNiveau + 0.15)} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4. desk : vrais prix, argent fictif

const Trading: React.FC = () => {
  const f = useCurrentFrame();
  const tBuy = wordT(3, 'achètes') + 0.3;
  const tPrix = wordT(3, 'sur');
  const tFictif = wordT(3, 'avec');
  const shots: Shot[] = [
    { src: 'btc-dark', at: sec(AD.trading) },
    { src: 'ordre', at: sec(tBuy + 0.08), mode: 'push', dur: 14 },
    { src: 'btc-dark', at: sec(tPrix), mode: 'cut' },
    { src: 'portefeuille', at: sec(tFictif), mode: 'push', dur: 14 },
  ];
  const full: Pose = { ...P0, rotY: 8 };
  const pose = handheld(
    posePath(f, [
      [AD.trading, focus(190, 180, 2600, 540, 760)],
      [AD.trading + 0.4, full],
      [tPrix - 0.02, { ...full, rotY: -4 }],
      [tPrix, focus(200, 380, 2100, 540, 820)],
      [tFictif - 0.15, focus(230, 360, 1900, 540, 820)],
      [tFictif + 0.25, { ...P0, rotY: -8 }],
      [AD.simu, { ...P0, rotY: -2 }],
    ]),
    f,
  );
  return (
    <AbsoluteFill>
      <Phone pose={pose} shots={shots}>
        <Finger keys={tap(tBuy, 290, 667)} size={FINGER} />
      </Phone>
      <Sticker at={sec(tPrix + 0.1)} out={sec(tFictif)} x={300} y={330} rot={-7} bg="#ffffff" size={62}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: K.green,
              boxShadow: `0 0 0 ${4 + 4 * Math.abs(Math.sin(f / 8))}px rgba(48,209,88,0.35)`,
            }}
          />
          PRIX EN DIRECT
        </span>
      </Sticker>
      <Sticker at={sec(wordT(3, "l'argent"))} x={560} y={1120} rot={-5} size={92}>
        ARGENT FICTIF
      </Sticker>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5. mille futurs

const Simu: React.FC = () => {
  const f = useCurrentFrame();
  const tMille = wordT(4, '1');
  const base: Pose = { cx: 470, cy: 830, h: 1250, rotY: 0 };
  const steady = tw(f, sec(tMille - 0.4), sec(tMille - 0.1), 1, 0.15);
  const pose = handheld(
    posePath(f, [
      [AD.simu, { ...base, h: 1180, rotY: -10 }],
      [tMille - 0.1, base],
      [AD.scenarios, { ...base, h: 1330 }],
    ]),
    f,
    steady,
  );
  const shots: Shot[] = [
    { src: 'simulation', at: sec(AD.simu) },
    { src: 'simulation-2', at: sec(14.15), mode: 'scroll', dur: 16 },
  ];
  const k = pose.h / 871;
  const ox = pose.cx + (172 - 195) * k;
  const oy = pose.cy + (360 - 422) * k;
  return (
    <AbsoluteFill>
      <Phone pose={pose} shots={shots} />
      <FutureBurst at={sec(tMille)} ox={ox} oy={oy} />
      <Sticker at={sec(tMille + 0.15)} x={720} y={330} rot={6} size={84}>
        1 000 FUTURS
      </Sticker>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 6. une vraie crise, à l'aveugle

const Scenarios: React.FC = () => {
  const f = useCurrentFrame();
  const tAveugle = wordT(5, 'à');
  const tTap1 = 17.3;
  const tTap2 = wordT(6, 'parti') + 0.02;
  const tPuis = wordT(6, 'puis');
  const STOP = AD.verite - BEAT;
  const shots: Shot[] = [
    { src: 'scn-brief', at: sec(AD.scenarios) },
    { src: 'scn-parti', at: sec(tTap1 + 0.08), mode: 'push', dur: 14 },
    { src: 'scn-parti-choix', at: sec(tTap2 + 0.05), mode: 'fade', dur: 6 },
    { src: 'scn-lecture-1', at: sec(tPuis - 0.05), mode: 'push', dur: 12 },
    { src: 'scn-lecture-2', at: sec(STOP - 0.12), mode: 'cut' },
    { src: 'scn-lecture-3', at: sec(STOP + 0.2), mode: 'cut' },
    { src: 'scn-revele', at: sec(AD.verite), mode: 'cut' },
  ];
  const up: Pose = { ...P0, cy: 720 };
  const pose = handheld(
    posePath(f, [
      [AD.scenarios, focus(200, 230, 2300, 540, 760)],
      [AD.scenarios + 0.7, { ...up, rotY: -8 }],
      [tPuis, { ...up, rotY: 6 }],
      [STOP, { ...up, rotY: 0 }],
      [AD.verite - 0.02, { ...up, h: 1560, rotY: 0 }],
      [AD.verite, focus(195, 115, 2300, 540, 700)],
      [AD.verite + 0.9, { ...P0, rotY: -6 }],
      [AD.carriere, { ...P0, rotY: -2 }],
    ]),
    f,
  );
  // Pendant la coupure de la musique : image figée, légèrement désaturée.
  const freeze = f >= sec(STOP) && f < sec(AD.verite);
  return (
    <AbsoluteFill style={{ filter: freeze ? 'saturate(0.2) contrast(1.15)' : undefined }}>
      <Phone pose={pose} shots={shots}>
        <Finger keys={tap(tTap1, 195, 772)} size={FINGER} />
        <Finger keys={tap(tTap2, 200, 366)} size={FINGER} />
      </Phone>
      <Sticker at={sec(tAveugle)} out={sec(tTap1)} x={540} y={300} rot={-5} bg="#000" color="#fff" size={78}>
        À L’AVEUGLE
      </Sticker>
      <Sticker at={sec(AD.verite + 0.06)} x={800} y={560} rot={9} size={130}>
        2008
      </Sticker>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 7. de stagiaire à MD

const GRADES = ['STAGIAIRE', 'ANALYSTE', 'ASSOCIATE', 'VP', 'DIRECTOR', 'MD'];
const AVATAR_X = [46, 108, 175, 237, 291, 346];
const AVATAR_Y = 152;

const Carriere: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const t0 = wordT(7, 'stagiaire');
  const t1 = wordT(7, 'Director');
  // « Stagiaire » tient pendant le mot, puis les grades défilent vite (machine à sous) jusqu'à MD sur « Director ».
  const tRun = wordT(7, 'à');
  const T = [t0, tRun, ...[1, 2, 3].map((i) => tRun + ((t1 - tRun) * i) / 4), t1];
  const g = Math.max(0, T.filter((x) => t >= x).length - 1);
  const xf = tw(t, tRun, t1, 110, 285, EZ.inOut);
  // Le téléphone plonge sur la rangée des grades, puis glisse de Stagiaire à MD au rythme de la voix.
  const zoomIn = posePath(f, [
    [AD.carriere, { ...P0, rotY: -6 }],
    [AD.carriere + 0.6, focus(110, AVATAR_Y, 2900, 540, 1010)],
  ]);
  const pose = handheld(t >= t0 ? focus(xf, AVATAR_Y, 2900 + tw(t, t1, AD.fin, 0, 160), 540, 1010) : zoomIn, f, 0.6);
  // Anneau vert qui saute d'avatar en avatar.
  const ringX = AVATAR_X[g];
  const ringPop = usePop(sec(T[g]), 500, 14);
  const isMD = g === 5;
  return (
    <AbsoluteFill>
      <Phone pose={pose} shots={[{ src: 'carriere-2', at: 0 }]}>
        {t >= t0 && (
          <div
            style={{
              position: 'absolute',
              left: ringX - 33,
              top: AVATAR_Y - 33,
              width: 66,
              height: 66,
              borderRadius: '50%',
              border: `4px solid ${K.green}`,
              boxShadow: '0 0 14px rgba(48,209,88,0.6)',
              transform: `scale(${0.7 + 0.3 * ringPop})`,
            }}
          />
        )}
      </Phone>
      {t >= t0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 300,
            transform: `translateY(-50%) scale(${0.8 + 0.2 * ringPop * (isMD ? 1.15 : 1)})`,
            textAlign: 'center',
            fontFamily: TEXT,
            fontWeight: 900,
            fontSize: isMD ? 210 : 130,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: isMD ? K.green : K.ink,
            textShadow: outline(5),
          }}
        >
          {GRADES[g]}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 8. logo, slogan, bientôt

const FinWord: React.FC<{ w: Word; color?: string }> = ({ w, color = K.ink }) => {
  const f = useCurrentFrame();
  const at = sec(w.t0) - 1;
  const k = usePop(at, 420, 15);
  return (
    <span
      style={{
        display: 'inline-block',
        color,
        opacity: f >= at ? 1 : 0,
        transform: `scale(${0.5 + 0.5 * k}) translateY(${(1 - k) * 30}px)`,
      }}
    >
      {w.text.toUpperCase()}
    </span>
  );
};

const Fin: React.FC = () => {
  const f = useCurrentFrame();
  const words = lineWords(8);
  const tBase = wordT(8, 'Base');
  const tPoint = wordT(8, 'Point');
  const letters = usePop(sec(tBase), 360, 14);
  const dot = usePop(sec(tPoint), 520, 9);
  const name = tw(f, sec(tPoint), sec(tPoint + 0.4), 0, 1, EZ.out);
  const cta = usePop(sec(wordT(9, 'Bientôt')), 320, 13);
  const rowA = words.filter((w) => w.sentence === 1);
  const rowB = words.filter((w) => w.sentence === 2);
  const drift = 1 + tw(f, sec(AD.fin), sec(AD.end), 0, 0.04, EZ.soft);
  const row = (ws: Word[], color?: string) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0 0.24em', flexWrap: 'wrap' }}>
      {ws.map((w) => (
        <FinWord key={w.t0} w={w} color={color} />
      ))}
    </div>
  );
  return (
    <AbsoluteFill style={{ transform: `scale(${drift})` }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 36%, rgba(48,209,88,0.13), rgba(0,0,0,0) 70%)' }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 520,
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${1.5 - 0.5 * letters})`,
          opacity: f >= sec(tBase) ? 1 : 0,
          filter: letters < 0.7 ? `blur(${(0.7 - letters) * 20}px)` : undefined,
        }}
      >
        <BpsMark size={250} dot={dot} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 810,
          textAlign: 'center',
          fontFamily: DISPLAY,
          fontWeight: 600,
          fontSize: 60,
          letterSpacing: '-0.02em',
          color: K.gray,
          opacity: name,
          transform: `translateY(${(1 - name) * 20}px)`,
        }}
      >
        Base Point
      </div>
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 1000,
          fontFamily: TEXT,
          fontWeight: 900,
          fontSize: 92,
          lineHeight: 1.04,
          letterSpacing: '-0.03em',
          textAlign: 'center',
        }}
      >
        {row(rowA)}
        <div style={{ height: 14 }} />
        {row(rowB, K.green)}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 540,
          top: 1400,
          transform: `translate(-50%, -50%) scale(${cta})`,
          padding: '24px 48px',
          borderRadius: 999,
          background: '#ffffff',
          color: '#000',
          fontFamily: TEXT,
          fontWeight: 800,
          fontSize: 50,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        Bientôt sur iOS et Android
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ composition

const skipCaption = (w: Word) => w.line === 0 || (w.line === 1 && w.sentence === 0) || w.line >= 8;

export const AdGenZ: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Camera>
      <Scene from={AD.hook} to={AD.normal} win="none" wout="zoom">
        <Hook />
      </Scene>
      <Scene from={AD.normal} to={AD.lecons} win="none" wout="left">
        <Normal />
      </Scene>
      <Scene from={AD.lecons} to={AD.trading} win="left" wout="up">
        <Lecons />
      </Scene>
      <Scene from={AD.trading} to={AD.simu} win="up" wout="left">
        <Trading />
      </Scene>
      <Scene from={AD.simu} to={AD.scenarios} win="left" wout="zoom">
        <Simu />
      </Scene>
      <Scene from={AD.scenarios} to={AD.carriere} win="zoom" wout="up">
        <Scenarios />
      </Scene>
      <Scene from={AD.carriere} to={AD.fin} win="up" wout="zoom">
        <Carriere />
      </Scene>
      <Scene from={AD.fin} to={AD.end} win="zoom" wout="none">
        <Fin />
      </Scene>
    </Camera>
    <Captions skip={skipCaption} y={() => CAPTION_Y} />
    <Flash at={[AD.normal, AD.verite, AD.fin]} />
    <Flash at={[AD.lecons, AD.trading, AD.simu, AD.scenarios, AD.carriere]} strength={0.22} />
    <Audio src={staticFile('audio/base-point-genz-voix.wav')} />
  </AbsoluteFill>
);
