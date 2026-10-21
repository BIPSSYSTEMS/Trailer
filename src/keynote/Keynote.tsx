import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Finger, TouchKey } from '../components/Touch';
import { KC } from './copy';
import { IPhone, Pose, Shot } from './IPhone';
import { BpsMark, Callout, Chips, Glow, Steps, useMeasure } from './parts';
import { DISPLAY, Eyebrow, EZ, Headline, K, kf, Reveal, sec, Stat, Sub, tw } from './style';
import { KSECTIONS, KSTART, KTOTAL, KXFADE } from './timeline';

// ------------------------------------------------------------------ mise en page commune

const LEFT = 150;
/** Pose du téléphone au repos dans les sections « fonctionnalité » (texte à gauche, légendes à droite). */
const HOME: Pose = { cx: 1250, cy: 548, h: 900 };
const LABEL_X = 1540;

/** Entrée douce du téléphone (montée, rotation qui se pose) puis léger flottement. */
const usePose = (base: Pose = HOME, from = -24): Pose => {
  const f = useCurrentFrame();
  const t = tw(f, 0, sec(1.6), 0, 1, EZ.out);
  return {
    ...base,
    cy: base.cy + (1 - t) * 140 + Math.sin(f / 70) * 4,
    rotY: (base.rotY ?? -6) + (1 - t) * from + Math.sin(f / 95) * 1.5,
    rotX: (base.rotX ?? 2) + Math.cos(f / 110) * 1,
    opacity: tw(f, 0, sec(0.8), 0, 1, EZ.out),
  };
};

const Title: React.FC<{ eyebrow: string; lines: readonly string[]; at?: number; out?: number; top?: number; size?: number }> = ({
  eyebrow,
  lines,
  at = sec(0.4),
  out,
  top = 250,
  size = 84,
}) => (
  <div style={{ position: 'absolute', left: LEFT, top, width: 900 }}>
    <Reveal at={at} out={out}>
      <Eyebrow>{eyebrow}</Eyebrow>
    </Reveal>
    <div style={{ height: 18 }} />
    {lines.map((l, i) => (
      <Reveal key={l} at={at + sec(0.25) + i * sec(0.25)} out={out}>
        <Headline size={size}>{l}</Headline>
      </Reveal>
    ))}
  </div>
);

/** Doigt dans le repère de l'écran (coordonnées en points iPhone). */
const tap = (f: number, x: number, y: number, from: [number, number] = [x + 60, y + 140]): TouchKey[] => [
  { f: f - sec(0.6), x: from[0], y: from[1] },
  { f: f - sec(0.1), x, y },
  { f, x, y, down: true },
  { f: f + sec(0.18), x, y, down: true },
  { f: f + sec(0.5), x: x + 30, y: y + 70 },
];

// ------------------------------------------------------------------ 1. ouverture : 0,01 % → BPS.

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const size = 210;
  const lettersW = useMeasure('BPS', 600, size, -0.035);
  const d = size * 0.19;
  const gapPx = size * 0.05;
  const total = lettersW + gapPx + d;
  const left = 960 - total / 2;
  const dotFinalX = left + lettersW + size * 0.05 + d / 2;
  const dotIn = tw(f, sec(5.3), sec(6.0), 0, 1, EZ.out);
  const slide = tw(f, sec(6.1), sec(7.1), 0, 1, EZ.inOut);
  const dotX = 960 + (dotFinalX - 960) * slide;
  const baseline = 560;
  return (
    <AbsoluteFill>
      <Glow strength={0.6} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Reveal at={sec(0.6)} out={sec(5.1)} dy={20} style={{ position: 'absolute', top: 330 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 300, fontSize: 250, letterSpacing: '-0.05em', color: K.ink, lineHeight: 1 }}>
            {KC.intro.value}
          </div>
        </Reveal>
        <Reveal at={sec(2.4)} out={sec(5.1)} style={{ position: 'absolute', top: 650, width: '100%' }}>
          <Sub size={48} align="center">
            {KC.intro.meaning}
          </Sub>
        </Reveal>
      </AbsoluteFill>
      {/* Le point vert naît au centre, puis les lettres BPS sortent de derrière lui. */}
      {f >= sec(5.3) && (
        <>
          {/* Les lettres sont accrochées au point et en sortent vers la gauche (masque à droite). */}
          <div
            style={{
              position: 'absolute',
              left: dotX - d / 2 - gapPx - lettersW * slide,
              top: baseline - size * 0.74,
              width: lettersW + 4,
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: size,
              letterSpacing: '-0.035em',
              lineHeight: 1,
              color: K.ink,
              clipPath: `inset(-20% ${lettersW * (1 - slide)}px -20% -2%)`,
            }}
          >
            BPS
          </div>
          <div
            style={{
              position: 'absolute',
              left: dotX - d / 2,
              top: baseline - d + size * 0.0,
              width: d,
              height: d,
              borderRadius: '50%',
              background: K.green,
              transform: `scale(${dotIn})`,
              boxShadow: `0 0 ${40 * (1 - slide)}px rgba(48,209,88,0.6)`,
            }}
          />
          <Reveal at={sec(7.3)} style={{ position: 'absolute', top: 640, width: '100%' }}>
            <Sub size={44} align="center">
              {KC.intro.name}
            </Sub>
          </Reveal>
        </>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 2. promesse

const Promise: React.FC = () => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <Reveal at={sec(0.4)}>
        <Headline size={96} align="center">
          {KC.promise[0]}
        </Headline>
      </Reveal>
      <Reveal at={sec(1.3)}>
        <Headline size={96} align="center" color={K.gray}>
          {KC.promise[1]}
        </Headline>
      </Reveal>
    </div>
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 3. le téléphone

const RevealPhone: React.FC = () => {
  const f = useCurrentFrame();
  const pose: Pose = {
    cx: kf(f, [
      [0, 960],
      [sec(4.6), 960],
      [sec(6), 1250],
    ]),
    cy:
      kf(
        f,
        [
          [0, 700],
          [sec(1.8), 548],
        ],
        EZ.out,
      ) +
      Math.sin(f / 70) * 4,
    h: kf(
      f,
      [
        [0, 760],
        [sec(2.4), 900],
      ],
      EZ.out,
    ),
    rotY: kf(f, [
      [0, 200],
      [sec(1.6), 168],
      [sec(4.2), -2],
      [sec(6), -8],
    ]),
    rotX: kf(f, [
      [0, 10],
      [sec(3), 3],
    ]),
    rotZ: kf(f, [
      [0, -6],
      [sec(3), 0],
    ]),
    opacity: tw(f, 0, sec(0.9), 0, 1, EZ.out),
  };
  return (
    <AbsoluteFill>
      <Glow
        x={kf(f, [
          [0, 0.5],
          [sec(6), 0.65],
        ])}
        strength={0.8}
      />
      <IPhone pose={pose} shots={[{ src: 'home', at: 0 }]} />
      <Title eyebrow={KC.reveal.eyebrow} lines={KC.reveal.title} at={sec(5.8)} top={330} />
      <Reveal at={sec(7)} style={{ position: 'absolute', left: LEFT, top: 600 }}>
        <Sub size={36}>{KC.reveal.sub}</Sub>
      </Reveal>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4. vue d'ensemble (grille)

const Overview: React.FC = () => {
  const f = useCurrentFrame();
  const W = 390;
  const H = 330;
  const gap = 26;
  const x0 = (1920 - (4 * W + 3 * gap)) / 2;
  const y0 = 250;
  return (
    <AbsoluteFill>
      <Reveal at={sec(0.3)} style={{ position: 'absolute', top: 105, width: '100%' }}>
        <Headline size={64} align="center">
          {KC.overview.title}
        </Headline>
      </Reveal>
      {KC.overview.tiles.map((t, i) => {
        const at = sec(1.1) + i * sec(0.14);
        const k = tw(f, at, at + sec(1), 0, 1, EZ.out);
        const x = x0 + (i % 4) * (W + gap);
        const y = y0 + Math.floor(i / 4) * (H + gap);
        const drift = 1 + tw(f, at, sec(11), 0, 0.03, EZ.soft);
        return (
          <div
            key={t.name}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: W,
              height: H,
              borderRadius: 30,
              background: K.tile,
              border: `1px solid ${K.tileLine}`,
              overflow: 'hidden',
              opacity: k,
              transform: `translateY(${(1 - k) * 40}px) scale(${0.96 + 0.04 * k})`,
            }}
          >
            <div style={{ position: 'absolute', left: 30, top: 26, fontFamily: DISPLAY }}>
              <div style={{ fontSize: 34, fontWeight: 600, color: K.ink, letterSpacing: '-0.02em' }}>{t.name}</div>
              <div style={{ fontSize: 23, fontWeight: 500, color: K.gray, marginTop: 4 }}>{t.stat}</div>
            </div>
            <div
              style={{
                position: 'absolute',
                left: 40,
                right: 40,
                top: 130,
                height: 260,
                borderRadius: 22,
                overflow: 'hidden',
                transform: `scale(${drift})`,
                transformOrigin: 'top center',
              }}
            >
              <Img src={staticFile(`keynote-screens/${t.src}.jpg`)} style={{ width: '100%', marginTop: '-15%' }} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 120,
                background: `linear-gradient(rgba(20,20,22,0), ${K.tile})`,
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5. parcours

const Parcours: React.FC = () => {
  const pose = usePose();
  const c = KC.parcours;
  const shots: Shot[] = [
    { src: 'parcours', at: 0 },
    { src: 'lecon-concept', at: sec(3), mode: 'push' },
    { src: 'lecon-quiz', at: sec(6), mode: 'push' },
    { src: 'lecon-quiz-choix', at: sec(7.1) },
    { src: 'lecon-quiz-reponse', at: sec(8.3) },
    { src: 'lecon-courbe', at: sec(10.2), mode: 'push' },
    { src: 'lecon-bips', at: sec(12.8), mode: 'push' },
  ];
  return (
    <AbsoluteFill>
      <Glow x={0.65} />
      <IPhone pose={pose} shots={shots}>
        <Finger size={46} keys={[...tap(sec(2.6), 195, 363), ...tap(sec(7.0), 160, 238), ...tap(sec(8.2), 195, 703)]} />
      </IPhone>
      <Title eyebrow={c.eyebrow} lines={c.title} out={sec(12.2)} />
      <div style={{ position: 'absolute', left: LEFT, top: 560, display: 'flex', gap: 80 }}>
        {c.stats.map((s, i) => (
          <Reveal key={s.value} at={sec(1.8) + i * sec(0.5)} out={sec(12.2)}>
            <Stat value={s.value} label={s.label} size={88} />
          </Reveal>
        ))}
      </div>
      <Callout
        pose={pose}
        pt={[130, 525]}
        label={[LABEL_X, 640]}
        align="right"
        text={c.source}
        sub={c.sourceSub}
        at={sec(3.8)}
        out={sec(5.8)}
      />
      <Callout pose={pose} pt={[120, 420]} label={[LABEL_X, 440]} align="right" text={c.quiz} at={sec(8.7)} out={sec(10)} />
      <Callout
        pose={pose}
        pt={[195, 560]}
        label={[LABEL_X, 560]}
        align="right"
        text="Courbes indicatives"
        sub="pour voir avant de calculer"
        at={sec(10.8)}
        out={sec(12.4)}
      />
      <Title eyebrow="Le saviez-vous ?" lines={c.bips.title} at={sec(13)} />
      <Reveal at={sec(14)} style={{ position: 'absolute', left: LEFT, top: 560 }}>
        <Sub size={36}>{c.bips.sub}</Sub>
      </Reveal>
      <Callout
        pose={pose}
        pt={[195, 427]}
        label={[LABEL_X, 427]}
        align="right"
        text="Le cours « Parler en bips »"
        at={sec(14.2)}
        out={sec(16.6)}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 6. marchés

const Marches: React.FC = () => {
  const pose = usePose();
  const c = KC.marches;
  const shots: Shot[] = [
    { src: 'marches', at: 0 },
    { src: 'btc', at: sec(2.4), mode: 'push' },
    { src: 'ordre', at: sec(6.2), mode: 'push' },
    { src: 'ordre-oco', at: sec(7.4) },
    { src: 'portefeuille', at: sec(10.8), mode: 'push' },
  ];
  return (
    <AbsoluteFill>
      <Glow x={0.65} />
      <IPhone pose={pose} shots={shots}>
        <Finger size={46} keys={[...tap(sec(2.0), 200, 285), ...tap(sec(7.2), 326, 221), ...tap(sec(10.4), 300, 72, [300, 200])]} />
      </IPhone>
      <Title eyebrow={c.eyebrow} lines={c.title} />
      <Reveal at={sec(1.8)} style={{ position: 'absolute', left: LEFT, top: 560 }}>
        <Stat value={c.stat.value} label={c.stat.label} size={88} />
      </Reveal>
      <Callout
        pose={pose}
        pt={[200, 137]}
        label={[LABEL_X, 220]}
        align="right"
        text={c.callouts.live}
        sub="Crypto, actions, devises, matières"
        at={sec(3)}
        out={sec(6)}
      />
      <Callout pose={pose} pt={[200, 212]} label={[LABEL_X, 340]} align="right" text={c.callouts.frames} at={sec(3.6)} out={sec(6)} />
      <Callout
        pose={pose}
        pt={[326, 221]}
        label={[LABEL_X, 300]}
        align="right"
        text={c.callouts.oco}
        sub="Objectif, stop-loss, stop suiveur"
        at={sec(7.8)}
        out={sec(10.5)}
      />
      <Callout
        pose={pose}
        pt={[60, 572]}
        label={[LABEL_X, 600]}
        align="right"
        text={c.callouts.lev}
        sub="Selon l’actif"
        at={sec(8.4)}
        out={sec(10.5)}
      />
      <Callout
        pose={pose}
        pt={[120, 180]}
        label={[LABEL_X, 300]}
        align="right"
        text="Rendement, P&L, statistiques"
        at={sec(11.4)}
        out={sec(13.6)}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 7. simulation

const Simulation: React.FC = () => {
  const pose = usePose();
  const c = KC.simulation;
  return (
    <AbsoluteFill>
      <Glow x={0.65} />
      <IPhone
        pose={pose}
        shots={[
          { src: 'simulation', at: 0 },
          { src: 'simulation-2', at: sec(3.4), mode: 'scroll' },
        ]}
      />
      <Title eyebrow={c.eyebrow} lines={c.title} />
      <Callout
        pose={pose}
        pt={[100, 185]}
        label={[LABEL_X, 220]}
        align="right"
        text="Fourchettes de prix"
        sub="1 chance sur 2, 9 chances sur 10"
        at={sec(1.2)}
        out={sec(3.3)}
      />
      <Callout
        pose={pose}
        pt={[160, 565]}
        label={[LABEL_X, 560]}
        align="right"
        text={c.callout}
        sub={c.calloutSub}
        at={sec(4.2)}
        out={sec(8.6)}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 8. options

const Options: React.FC = () => {
  const pose = usePose();
  const c = KC.options;
  const shots: Shot[] = [
    { src: 'options-chaine', at: 0 },
    { src: 'options-fiche', at: sec(3.8), mode: 'push' },
    { src: 'options-fiche-2', at: sec(7.4), mode: 'scroll' },
    { src: 'options-fiche-3', at: sec(10.2), mode: 'scroll' },
  ];
  return (
    <AbsoluteFill>
      <Glow x={0.65} />
      <IPhone pose={pose} shots={shots}>
        <Finger size={46} keys={tap(sec(3.4), 70, 473)} />
      </IPhone>
      <Title eyebrow={c.eyebrow} lines={c.title} />
      <Reveal at={sec(1.8)} style={{ position: 'absolute', left: LEFT, top: 560, width: 760 }}>
        <Sub size={34}>Prix calculés et affichés comme théoriques, sur un compte fictif.</Sub>
      </Reveal>
      <Callout pose={pose} pt={[195, 188]} label={[LABEL_X, 240]} align="right" text={c.callouts.chain} at={sec(1)} out={sec(3.4)} />
      <Callout pose={pose} pt={[150, 165]} label={[LABEL_X, 240]} align="right" text={c.callouts.premium} at={sec(4.5)} out={sec(7.2)} />
      <Callout pose={pose} pt={[200, 220]} label={[LABEL_X, 300]} align="right" text={c.callouts.payoff} at={sec(8)} out={sec(10)} />
      <Callout
        pose={pose}
        pt={[60, 129]}
        label={[LABEL_X, 260]}
        align="right"
        text={c.callouts.greeks}
        sub="Chacune expliquée en une phrase"
        at={sec(10.8)}
        out={sec(12.8)}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 9. hedge lab

const Hedge: React.FC = () => {
  const pose = usePose();
  const c = KC.hedge;
  const shots: Shot[] = [
    { src: 'hedge', at: 0 },
    { src: 'hedge-lecon', at: sec(3.2), mode: 'push' },
    { src: 'hedge-labo-2', at: sec(6.4), mode: 'push' },
  ];
  return (
    <AbsoluteFill>
      <Glow x={0.65} />
      <IPhone pose={pose} shots={shots}>
        <Finger size={46} keys={tap(sec(2.8), 300, 240)} />
      </IPhone>
      <Title eyebrow={c.eyebrow} lines={c.title} />
      <div style={{ position: 'absolute', left: LEFT, top: 560, display: 'flex', gap: 80 }}>
        {c.stats.map((s, i) => (
          <Reveal key={s.value} at={sec(1.8) + i * sec(0.5)}>
            <Stat value={s.value} label={s.label} size={88} />
          </Reveal>
        ))}
      </div>
      <Callout
        pose={pose}
        pt={[120, 172]}
        label={[LABEL_X, 230]}
        align="right"
        text="Chaque mot expliqué"
        sub="Lexique sourcé"
        at={sec(3.8)}
        out={sec(6.2)}
      />
      <Callout
        pose={pose}
        pt={[200, 290]}
        label={[LABEL_X, 330]}
        align="right"
        text={c.callout}
        sub="Résultat à l’échéance"
        at={sec(7.2)}
        out={sec(10.6)}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 10. scénarios

const Scenarios: React.FC = () => {
  const f = useCurrentFrame();
  const pose = usePose();
  const c = KC.scenarios;
  const STEP = [sec(2.4), sec(6.0), sec(9.6), sec(15.2)];
  let active = 0;
  STEP.forEach((a, i) => {
    if (f >= a) active = i;
  });
  const shots: Shot[] = [
    { src: 'scn-liste', at: 0 },
    { src: 'scn-brief', at: STEP[0], mode: 'push' },
    { src: 'scn-parti', at: STEP[1], mode: 'push' },
    { src: 'scn-parti-choix', at: sec(8) },
    { src: 'scn-lecture-1', at: STEP[2], mode: 'push' },
    { src: 'scn-lecture-2', at: sec(11.2) },
    { src: 'scn-lecture-3', at: sec(12.8) },
    { src: 'scn-revele', at: STEP[3], mode: 'push' },
  ];
  return (
    <AbsoluteFill>
      <Glow x={0.65} />
      <IPhone pose={pose} shots={shots}>
        <Finger
          size={46}
          keys={[
            ...tap(sec(2.0), 195, 330),
            ...tap(sec(5.6), 195, 769),
            ...tap(sec(7.2), 150, 371),
            ...tap(sec(7.9), 150, 680),
            ...tap(sec(9.2), 195, 769),
            ...tap(sec(14.8), 195, 769),
          ]}
        />
      </IPhone>
      <Title eyebrow={c.eyebrow} lines={c.title} top={200} />
      <Steps items={c.steps} active={active} at={sec(1.6)} x={LEFT} y={500} />
      <Reveal at={sec(16)} style={{ position: 'absolute', left: LEFT, top: 790 }}>
        <Sub size={28}>{c.sub}</Sub>
      </Reveal>
      <Callout
        pose={pose}
        pt={[60, 562]}
        label={[LABEL_X, 600]}
        align="right"
        text="Chaque pari tranché en direct"
        at={sec(13.2)}
        out={sec(15)}
      />
      <Callout
        pose={pose}
        pt={[150, 180]}
        label={[LABEL_X, 260]}
        align="right"
        text="L’événement, daté et sourcé"
        sub="SEC, Réserve fédérale"
        at={sec(16)}
        out={sec(18.6)}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 11. carte et relations

const VIEW = { lon0: -14, lon1: 24, lat0: 35, lat1: 57 };
const PANEL = { x: LEFT, y: 470, w: 820, h: (820 * (57 - 35)) / (24 + 14) };
const proj = (lon: number, lat: number) =>
  [
    Math.max(PANEL.x + 24, PANEL.x + ((lon - VIEW.lon0) / (VIEW.lon1 - VIEW.lon0)) * PANEL.w),
    PANEL.y + ((VIEW.lat1 - Math.max(lat, VIEW.lat0 + 3)) / (VIEW.lat1 - VIEW.lat0)) * PANEL.h,
  ] as const;
/** Principaux clients de la France, tels qu'affichés dans la fiche pays de l'app. */
const PARTNERS = [
  { name: 'Allemagne', share: 12.6, ll: [13.4, 52.5], lab: [16, -10, 'start'] },
  { name: 'États-Unis', share: 8.2, ll: [-77, 49], lab: [6, -18, 'start'] },
  { name: 'Italie', share: 7.9, ll: [12.5, 41.9], lab: [16, 22, 'start'] },
  { name: 'Belgique', share: 7.5, ll: [4.35, 50.85], lab: [0, -22, 'middle'] },
  { name: 'Espagne', share: 6.9, ll: [-3.7, 40.4], lab: [-14, 30, 'end'] },
] as const;

const Relations: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const k = tw(f, at, at + sec(0.8), 0, 1, EZ.out);
  if (k <= 0) return null;
  const [px, py] = proj(2.35, 48.85);
  const bgW = (PANEL.w * 360) / (VIEW.lon1 - VIEW.lon0);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: k }}>
      <div
        style={{ position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, overflow: 'hidden', borderRadius: 26 }}
      >
        <Img
          src={staticFile('textures/land-mask.png')}
          style={{
            position: 'absolute',
            left: -((VIEW.lon0 + 180) / 360) * bgW,
            top: -((90 - VIEW.lat1) / 180) * (bgW / 2),
            width: bgW,
            height: bgW / 2,
            opacity: 0.13,
          }}
        />
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {PARTNERS.map((p, i) => {
          const a = at + sec(0.6) + i * sec(0.45);
          const t = tw(f, a, a + sec(1), 0, 1, EZ.inOut);
          if (t <= 0) return null;
          const [x, y] = proj(p.ll[0], p.ll[1]);
          const mx = (px + x) / 2;
          const my = Math.min(py, y) - Math.hypot(x - px, y - py) * 0.35 - 20;
          const len = Math.hypot(x - px, y - py) * 1.4 + 60;
          return (
            <g key={p.name}>
              <path
                d={`M ${px} ${py} Q ${mx} ${my} ${x} ${y}`}
                fill="none"
                stroke={K.ink}
                strokeOpacity={0.85}
                strokeWidth={1 + p.share * 0.32}
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - t)}
              />
              <circle cx={x} cy={y} r={6 * t} fill={K.green} />
              <text
                x={x + p.lab[0]}
                y={y + p.lab[1]}
                textAnchor={p.lab[2]}
                fontFamily={DISPLAY}
                fontSize={24}
                fontWeight={600}
                fill={K.ink}
                opacity={tw(f, a + sec(0.6), a + sec(1), 0, 1)}
              >
                {p.name}
                <tspan fill={K.gray} fontWeight={500}>{`  ${p.share.toFixed(1).replace('.', ',')} %`}</tspan>
              </text>
            </g>
          );
        })}
        <circle cx={px} cy={py} r={9} fill={K.green} />
        <text x={px - 16} y={py - 14} textAnchor="end" fontFamily={DISPLAY} fontSize={26} fontWeight={700} fill={K.ink}>
          France
        </text>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: PANEL.x,
          top: PANEL.y - 50,
          fontFamily: DISPLAY,
          fontSize: 26,
          fontWeight: 600,
          color: K.gray,
        }}
      >
        {KC.carte.partnersTitle}
      </div>
      <div
        style={{
          position: 'absolute',
          left: PANEL.x,
          top: PANEL.y + PANEL.h + 16,
          fontFamily: DISPLAY,
          fontSize: 18,
          fontWeight: 500,
          color: K.dim,
        }}
      >
        {KC.carte.partnersNote}
      </div>
    </div>
  );
};

const Carte: React.FC = () => {
  const pose = usePose();
  const c = KC.carte;
  const shots: Shot[] = [
    { src: 'carte', at: 0 },
    { src: 'carte-exports', at: sec(1.9) },
    { src: 'carte-fra', at: sec(3.7) },
    { src: 'fiche-fra', at: sec(6.2), mode: 'push' },
    { src: 'fiche-fra-clients', at: sec(8.2), mode: 'scroll' },
  ];
  return (
    <AbsoluteFill>
      <Glow x={0.65} />
      <IPhone pose={pose} shots={shots}>
        <Finger size={46} keys={[...tap(sec(1.7), 290, 80), ...tap(sec(3.5), 105, 268), ...tap(sec(5.9), 195, 758)]} />
      </IPhone>
      <Title eyebrow={c.eyebrow} lines={c.title} top={150} size={76} />
      <Reveal at={sec(1.6)} out={sec(7.6)} style={{ position: 'absolute', left: LEFT, top: 420 }}>
        <Sub size={34}>{c.sub}</Sub>
      </Reveal>
      <Callout
        pose={pose}
        pt={[195, 675]}
        label={[LABEL_X, 680]}
        align="right"
        text="Taux, PIB, exportations"
        sub="Banque centrale, Banque mondiale, CEPII"
        at={sec(4.2)}
        out={sec(6)}
      />
      <Relations at={sec(8)} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 12. entretien

const Entretien: React.FC = () => {
  const pose = usePose();
  const c = KC.entretien;
  const shots: Shot[] = [
    { src: 'entretien', at: 0 },
    { src: 'entretien-question', at: sec(2.6), mode: 'push' },
    { src: 'entretien-reponse', at: sec(4.8) },
    { src: 'entretien-blanc', at: sec(7), mode: 'push' },
  ];
  return (
    <AbsoluteFill>
      <Glow x={0.65} />
      <IPhone pose={pose} shots={shots}>
        <Finger size={46} keys={[...tap(sec(2.3), 195, 380), ...tap(sec(4.6), 80, 289)]} />
      </IPhone>
      <Title eyebrow={c.eyebrow} lines={c.title} />
      <Reveal at={sec(1.6)} style={{ position: 'absolute', left: LEFT, top: 560 }}>
        <Stat value={c.stat.value} label={c.stat.label} size={88} />
      </Reveal>
      <div style={{ position: 'absolute', left: LEFT, top: 760 }}>
        <Chips items={c.cats} at={sec(2.4)} />
      </div>
      <Callout
        pose={pose}
        pt={[200, 360]}
        label={[LABEL_X, 380]}
        align="right"
        text="Méthode expliquée"
        sub="après chaque réponse"
        at={sec(5.2)}
        out={sec(6.9)}
      />
      <Callout pose={pose} pt={[351, 78]} label={[LABEL_X, 200]} align="right" text={c.callout} at={sec(7.6)} out={sec(9.8)} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 13. carrière + mode sombre

const Carriere: React.FC = () => {
  const f = useCurrentFrame();
  const c = KC.carriere;
  const base = usePose();
  const split = tw(f, sec(5.4), sec(6.8), 0, 1, EZ.inOut);
  const poseA: Pose = { ...base, cx: base.cx - 100 * split, rotY: (base.rotY ?? 0) + 8 * split };
  const poseB: Pose = { ...base, cx: base.cx + 290 * split + (1 - split) * 400, rotY: -14 * split - 30 * (1 - split), opacity: split };
  return (
    <AbsoluteFill>
      <Glow x={0.65} />
      {split > 0 && <IPhone pose={poseB} shots={[{ src: 'home-dark', at: 0 }]} finish="black" />}
      <IPhone
        pose={poseA}
        shots={[
          { src: 'carriere', at: 0 },
          { src: 'home', at: sec(5.4) },
        ]}
      />
      <Title eyebrow={c.eyebrow} lines={c.title} />
      <Reveal at={sec(6.6)} style={{ position: 'absolute', left: LEFT, top: 560 }}>
        <Sub size={40} color={K.ink}>
          {c.dark}
        </Sub>
      </Reveal>
      <Callout pose={poseA} pt={[195, 676]} label={[LABEL_X, 720]} align="right" text={c.callout} at={sec(1.8)} out={sec(5)} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 14. sources

const Sources: React.FC = () => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Glow strength={0.5} />
    <div style={{ width: 1400 }}>
      <Reveal at={sec(0.3)}>
        <Headline size={84} align="center">
          {KC.sources.title}
        </Headline>
      </Reveal>
      <div style={{ height: 60 }} />
      <Chips items={KC.sources.items} at={sec(1.4)} center size={32} />
    </div>
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 15. clôture

const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const out = tw(f, sec(4.2), sec(5.4), 0, 1, EZ.inOut);
  const phones: { src: string; cx: number; rotY: number; delay: number; h: number }[] = [
    { src: 'home', cx: 600, rotY: 22, delay: 0.3, h: 800 },
    { src: 'scn-revele', cx: 1320, rotY: -22, delay: 0.5, h: 800 },
    { src: 'options-fiche', cx: 960, rotY: 0, delay: 0, h: 880 },
  ];
  return (
    <AbsoluteFill>
      <Glow strength={0.7} />
      {out < 1 &&
        phones.map((p) => {
          const t = tw(f, sec(p.delay), sec(p.delay + 1.6), 0, 1, EZ.out);
          return (
            <IPhone
              key={p.src}
              pose={{
                cx: p.cx,
                cy: 548 + (1 - t) * 160 + out * 260,
                h: p.h,
                rotY: p.rotY + (1 - t) * (p.rotY >= 0 ? 20 : -20),
                rotX: 3,
                opacity: t * (1 - out),
              }}
              shots={[{ src: p.src, at: 0 }]}
            />
          );
        })}
      {f >= sec(5) && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Reveal at={sec(5)} dy={20} style={{ position: 'absolute', top: 290 }}>
            <BpsMark size={190} dot={tw(f, sec(5.4), sec(6), 0, 1, EZ.out)} />
          </Reveal>
          <Reveal at={sec(5.8)} style={{ position: 'absolute', top: 500 }}>
            <Sub size={42}>{KC.outro.name}</Sub>
          </Reveal>
          <Reveal at={sec(7)} style={{ position: 'absolute', top: 640, width: '100%' }}>
            <Headline size={56} align="center">
              {KC.outro.tagline[0]}
            </Headline>
          </Reveal>
          <Reveal at={sec(7.8)} style={{ position: 'absolute', top: 712, width: '100%' }}>
            <Headline size={56} align="center" color={K.gray}>
              {KC.outro.tagline[1]}
            </Headline>
          </Reveal>
          <Reveal at={sec(9)} style={{ position: 'absolute', top: 880, width: '100%' }}>
            <Sub size={28} align="center">
              {KC.outro.soon}
            </Sub>
          </Reveal>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ montage

const SCENES: Record<(typeof KSECTIONS)[number]['id'], React.FC> = {
  intro: Intro,
  promise: Promise,
  reveal: RevealPhone,
  overview: Overview,
  parcours: Parcours,
  marches: Marches,
  simulation: Simulation,
  options: Options,
  hedge: Hedge,
  scenarios: Scenarios,
  carte: Carte,
  entretien: Entretien,
  carriere: Carriere,
  sources: Sources,
  outro: Outro,
};

const Fader: React.FC<{ dur: number; first: boolean; last: boolean; children: React.ReactNode }> = ({ dur, first, last, children }) => {
  const f = useCurrentFrame();
  const a = first ? 1 : tw(f, 0, sec(KXFADE), 0, 1, EZ.inOut);
  const b = last ? 1 : tw(f, sec(dur), sec(dur + KXFADE), 1, 0, EZ.inOut);
  return <AbsoluteFill style={{ opacity: Math.min(a, b) }}>{children}</AbsoluteFill>;
};

export const Keynote: React.FC = () => (
  <AbsoluteFill style={{ background: K.bg }}>
    {KSECTIONS.map((x, i) => {
      const Scene = SCENES[x.id];
      const from = sec(KSTART[x.id]) - (i === 0 ? 0 : sec(KXFADE / 2));
      return (
        <Sequence key={x.id} name={x.id} from={from} durationInFrames={sec(x.dur + KXFADE)}>
          <Fader dur={x.dur} first={i === 0} last={i === KSECTIONS.length - 1}>
            <Scene />
          </Fader>
        </Sequence>
      );
    })}
    <Audio src={staticFile('audio/base-point-keynote.wav')} />
  </AbsoluteFill>
);

export const KEYNOTE_FRAMES = sec(KTOTAL);
