import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { LogoMonogram } from '../components/LogoConcepts';
import { Floor } from '../components/props3d';
import { Stage } from '../components/Stage';
import { Finger } from '../components/Touch';
import { EASE, tween } from '../lib/anim';
import { FONT } from '../theme';
import { ICOPY } from './copy';
import { ISECTIONS, ISTART, ITOTAL, s, XFADE } from './timeline';
import { Backdrop, FadeUp, Highlight, IC, Lift, Phone, phoneGeom, TextBlock } from './ui';

const G = phoneGeom(1400, 540, 900);
/** Téléphone décalé à droite pour la section « Rejouer » (place pour le déroulé et les encadrés). */
const G2 = phoneGeom(1530, 540, 900);

// ------------------------------------------------------------------ intro / clôture : logo 3D

const LogoScene: React.FC<{ outro?: boolean }> = ({ outro }) => {
  const f = useCurrentFrame();
  const tile = tween(f, s(0.4), s(2), 0, 1, EASE.out);
  const cam = (fr: number) => ({
    pos: [Math.sin(fr * 0.002) * 1.2, 0.3, (outro ? 9.6 : 10.2) - fr * 0.003] as [number, number, number],
    target: [0, 0.2, 0] as [number, number, number],
    fov: 30,
  });
  return (
    <AbsoluteFill>
      <Stage cam={cam} bloom={0.55} bloomThreshold={0.75} vignette={0.6} fog={[9, 30]} background={IC.bg} motionBlur={0}>
        <Floor y={-1.45} mirror={0.7} />
        <group position={[0, outro ? 0.55 : 0.25, 0]} rotation={[0, Math.sin(f * 0.004) * 0.12, 0]}>
          <LogoMonogram
            size={outro ? 0.82 : 1}
            tile={tile}
            p={tween(f, s(1), s(2.6), 0, 1, EASE.inOut)}
            sweep={tween(f, s(2.6), s(4.2), -1.2, 1.4, EASE.inOut)}
            wordReveal={(i) => tween(f, s(2.2) + i * s(0.15), s(2.9) + i * s(0.15), 0, 1, EASE.out)}
          />
        </group>
      </Stage>
      {!outro && (
        <FadeUp at={s(3.4)} style={{ position: 'absolute', bottom: 120, width: '100%', textAlign: 'center' }}>
          <div style={{ fontFamily: FONT, fontSize: 34, fontWeight: 500, color: IC.muted, letterSpacing: '0.01em' }}>
            {ICOPY.intro.subtitle}
          </div>
        </FadeUp>
      )}
      {outro && (
        <>
          <FadeUp at={s(2.8)} style={{ position: 'absolute', bottom: 210, width: '100%', textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontSize: 52, fontWeight: 700, color: IC.ink, letterSpacing: '-0.02em' }}>
              {ICOPY.outro.tagline[0]}
            </div>
          </FadeUp>
          <FadeUp at={s(3.6)} style={{ position: 'absolute', bottom: 145, width: '100%', textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontSize: 52, fontWeight: 700, color: IC.gold, letterSpacing: '-0.02em' }}>
              {ICOPY.outro.tagline[1]}
            </div>
          </FadeUp>
          <FadeUp at={s(5)} style={{ position: 'absolute', bottom: 70, width: '100%', textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 500, color: IC.muted }}>{ICOPY.outro.soon}</div>
          </FadeUp>
        </>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ problème

const Problem: React.FC = () => {
  const f = useCurrentFrame();
  // Tracé de cours très discret qui se dessine en fond.
  const pts = Array.from({ length: 120 }, (_, i) => {
    const x = (i / 119) * 1920;
    const y = 640 - i * 1.6 + Math.sin(i * 0.35) * 26 + Math.sin(i * 0.11) * 50;
    return `${x},${y}`;
  }).join(' ');
  const draw = tween(f, 0, s(7), 0, 1, EASE.linear);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
        <polyline points={pts} fill="none" stroke={IC.gold} strokeWidth={2} strokeDasharray={4000} strokeDashoffset={4000 * (1 - draw)} />
      </svg>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: FONT, gap: 26 }}>
        <FadeUp at={s(0.4)}>
          <div style={{ fontSize: 64, fontWeight: 700, color: IC.ink, letterSpacing: '-0.02em' }}>{ICOPY.problem[0]}</div>
        </FadeUp>
        <FadeUp at={s(2.4)}>
          <div style={{ fontSize: 64, fontWeight: 700, color: IC.gold, letterSpacing: '-0.02em' }}>{ICOPY.problem[1]}</div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ solution

const Solution: React.FC = () => (
  <AbsoluteFill>
    <TextBlock eyebrow={ICOPY.solution.eyebrow} title={ICOPY.solution.title} at={s(0.3)} y={330} titleSize={64} />
    <div style={{ position: 'absolute', left: 140, top: 640, display: 'flex', gap: 18 }}>
      {ICOPY.solution.pillars.map((p, i) => (
        <FadeUp key={p} at={s(2.2) + i * s(0.45)} dy={16}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 26,
              fontWeight: 600,
              color: IC.ink,
              padding: '14px 26px',
              borderRadius: 999,
              border: `1.5px solid ${IC.line}`,
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            {p}
          </div>
        </FadeUp>
      ))}
    </div>
    <Phone geom={G} at={s(0.8)} screens={[{ src: 'home', at: 0 }]} />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 01 apprendre

const Learn: React.FC = () => (
  <AbsoluteFill>
    <TextBlock {...ICOPY.learn} at={s(0.3)} />
    <Phone
      geom={G}
      at={0}
      screens={[
        { src: 'parcours', at: 0 },
        { src: 'lecon', at: s(4.2), mode: 'push' },
        { src: 'examens', at: s(7.6), mode: 'push' },
      ]}
    >
      <Finger
        size={52}
        keys={[
          { f: s(3.2), x: 260, y: 520 },
          { f: s(3.8), x: 195, y: 290 },
          { f: s(3.9), x: 195, y: 290, down: true },
          { f: s(4.1), x: 195, y: 290, down: true },
          { f: s(4.5), x: 240, y: 330 },
        ]}
      />
    </Phone>
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 02 pratiquer

const Trade: React.FC = () => (
  <AbsoluteFill>
    <TextBlock {...ICOPY.trade} at={s(0.3)} />
    <Phone
      geom={G}
      at={0}
      screens={[
        { src: 'marches', at: 0 },
        { src: 'btc', at: s(4.2), mode: 'push' },
        { src: 'ordre', at: s(7.4), mode: 'push' },
        { src: 'ordre-oco', at: s(8.6) },
      ]}
    >
      <Highlight x={12} y={72} w={366} h={186} at={s(1.6)} out={s(3.8)} />
      <Finger
        size={52}
        keys={[
          { f: s(3.4), x: 250, y: 330 },
          { f: s(3.9), x: 200, y: 365 },
          { f: s(4.0), x: 200, y: 365, down: true },
          { f: s(4.2), x: 200, y: 365, down: true },
          { f: s(4.6), x: 200, y: 300 },
          { f: s(6.6), x: 290, y: 760 },
          { f: s(7.1), x: 285, y: 606 },
          { f: s(7.2), x: 285, y: 606, down: true },
          { f: s(7.4), x: 285, y: 606, down: true },
          { f: s(8.2), x: 325, y: 167 },
          { f: s(8.45), x: 325, y: 167, down: true },
          { f: s(8.65), x: 325, y: 167, down: true },
          { f: s(9.1), x: 300, y: 170 },
        ]}
      />
    </Phone>
    <Lift
      geom={G}
      src="ordre-oco"
      rect={{ x: 12, y: 145, w: 366, h: 180 }}
      pos={[940, 940]}
      scale={1.1}
      at={s(9.6)}
      out={s(12.6)}
      label={ICOPY.trade.callouts.oco}
    />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 03 anticiper

const Sim: React.FC = () => (
  <AbsoluteFill>
    <TextBlock {...ICOPY.sim} at={s(0.3)} />
    <Phone
      geom={G}
      at={0}
      screens={[
        { src: 'simulation', at: 0 },
        { src: 'simulation-2', at: s(3.6) },
      ]}
    />
    <Lift
      geom={G}
      src="simulation-2"
      rect={{ x: 12, y: 405, w: 366, h: 135 }}
      pos={[700, 860]}
      scale={1.3}
      at={s(4.6)}
      out={s(8.6)}
      label={ICOPY.sim.callout}
    />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 04 rejouer l'histoire : déroulé en 4 étapes

const STEP_AT = [0, s(5), s(10), s(15.5)];

const Stepper: React.FC = () => {
  const f = useCurrentFrame();
  let cur = 0;
  STEP_AT.forEach((a, i) => {
    if (f >= a) cur = i;
  });
  return (
    <div style={{ position: 'absolute', left: 140, top: 210, width: 760, fontFamily: FONT }}>
      <FadeUp at={s(0.2)}>
        <div
          style={{ color: IC.gold, fontSize: 22, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 22 }}
        >
          {ICOPY.replay.eyebrow}
        </div>
      </FadeUp>
      <FadeUp at={s(0.5)}>
        <div style={{ color: IC.ink, fontSize: 56, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{ICOPY.replay.title}</div>
      </FadeUp>
      <div style={{ marginTop: 46, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 21, top: 22, bottom: 22, width: 2, background: IC.line }} />
        <div
          style={{
            position: 'absolute',
            left: 21,
            top: 22,
            width: 2,
            height: `${(Math.min(3, cur + tween(f, STEP_AT[cur], (STEP_AT[cur + 1] ?? s(21)) - s(0.5), 0, 1, EASE.linear)) / 3) * 80}%`,
            background: IC.gold,
          }}
        />
        {ICOPY.replay.steps.map((st, i) => {
          const active = i === cur;
          const done = i < cur;
          const k = tween(f, STEP_AT[i] - s(0.2), STEP_AT[i] + s(0.5), 0, 1, EASE.out);
          return (
            <FadeUp key={st.title} at={s(1) + i * s(0.25)}>
              <div style={{ display: 'flex', gap: 26, marginBottom: 30, opacity: active ? 1 : done ? 0.55 : 0.35 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 800,
                    color: active || done ? IC.bg : IC.muted,
                    background: active || done ? IC.gold : IC.bg,
                    border: `2px solid ${active || done ? IC.gold : IC.line}`,
                    position: 'relative',
                  }}
                >
                  {done ? '✓' : i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: IC.ink }}>{st.title}</div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 500,
                      color: IC.muted,
                      lineHeight: 1.4,
                      maxHeight: active ? 120 * k : 0,
                      overflow: 'hidden',
                      opacity: active ? k : 0,
                      marginTop: 8,
                    }}
                  >
                    {st.body}
                  </div>
                </div>
              </div>
            </FadeUp>
          );
        })}
      </div>
    </div>
  );
};

const Replay: React.FC = () => (
  <AbsoluteFill>
    <Stepper />
    <Phone
      geom={G2}
      at={0}
      screens={[
        { src: 'scn-liste', at: 0 },
        { src: 'scn-brief', at: s(2.2), mode: 'push' },
        { src: 'scn-parti', at: STEP_AT[1] + s(0.6), mode: 'push' },
        { src: 'scn-parti-choix', at: STEP_AT[1] + s(2.2) },
        { src: 'scn-lecture-1', at: STEP_AT[2] + s(0.4), mode: 'push' },
        { src: 'scn-lecture-2', at: STEP_AT[2] + s(1.6) },
        { src: 'scn-lecture-3', at: STEP_AT[2] + s(2.8) },
        { src: 'scn-lecture-4', at: STEP_AT[2] + s(4) },
        { src: 'scn-revele', at: STEP_AT[3] + s(0.6), mode: 'push' },
      ]}
    >
      <Finger
        size={52}
        keys={[
          { f: s(1.4), x: 300, y: 600 },
          { f: s(1.9), x: 200, y: 200 },
          { f: s(2.0), x: 200, y: 200, down: true },
          { f: s(2.2), x: 200, y: 200, down: true },
          { f: s(2.6), x: 250, y: 300 },
          { f: STEP_AT[1], x: 260, y: 700 },
          { f: STEP_AT[1] + s(0.3), x: 195, y: 804 },
          { f: STEP_AT[1] + s(0.4), x: 195, y: 804, down: true },
          { f: STEP_AT[1] + s(0.6), x: 195, y: 804, down: true },
          { f: STEP_AT[1] + s(1.5), x: 195, y: 351 },
          { f: STEP_AT[1] + s(1.6), x: 195, y: 351, down: true },
          { f: STEP_AT[1] + s(1.8), x: 195, y: 351, down: true },
          { f: STEP_AT[1] + s(2.6), x: 195, y: 660 },
          { f: STEP_AT[1] + s(2.7), x: 195, y: 660, down: true },
          { f: STEP_AT[1] + s(2.9), x: 195, y: 660, down: true },
          { f: STEP_AT[1] + s(3.4), x: 260, y: 520 },
          { f: STEP_AT[3], x: 280, y: 700 },
          { f: STEP_AT[3] + s(0.3), x: 195, y: 804 },
          { f: STEP_AT[3] + s(0.4), x: 195, y: 804, down: true },
          { f: STEP_AT[3] + s(0.6), x: 195, y: 804, down: true },
          { f: STEP_AT[3] + s(1), x: 240, y: 700 },
        ]}
      />
    </Phone>
    <Lift
      geom={G2}
      src="scn-parti-choix"
      rect={{ x: 20, y: 185, w: 350, h: 320 }}
      pos={[1110, 840]}
      scale={0.9}
      at={STEP_AT[1] + s(3.2)}
      out={STEP_AT[2]}
      label={ICOPY.replay.callouts[0]}
    />
    <Lift
      geom={G2}
      src="scn-lecture-4"
      rect={{ x: 20, y: 470, w: 340, h: 180 }}
      pos={[1110, 870]}
      scale={1}
      at={STEP_AT[2] + s(4.3)}
      out={STEP_AT[3]}
      label={ICOPY.replay.callouts[1]}
    />
    <Lift
      geom={G2}
      src="scn-revele"
      rect={{ x: 12, y: 60, w: 366, h: 260 }}
      pos={[1110, 850]}
      scale={0.9}
      at={STEP_AT[3] + s(1.4)}
      out={s(20.6)}
      label={ICOPY.replay.callouts[2]}
    />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 05 couvrir

const Hedge: React.FC = () => (
  <AbsoluteFill>
    <TextBlock {...ICOPY.hedge} at={s(0.3)} />
    <Phone
      geom={G}
      at={0}
      screens={[
        { src: 'hedge', at: 0 },
        { src: 'couverture', at: s(3.4), mode: 'push' },
        { src: 'regimes', at: s(5.8), mode: 'push' },
      ]}
    >
      <Finger
        size={52}
        keys={[
          { f: s(2.6), x: 280, y: 600 },
          { f: s(3.1), x: 195, y: 545 },
          { f: s(3.2), x: 195, y: 545, down: true },
          { f: s(3.4), x: 195, y: 545, down: true },
          { f: s(3.8), x: 260, y: 560 },
        ]}
      />
    </Phone>
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 06 comprendre le monde : relations entre pays

const LAND = { w: 2048, h: 1024 };
/** Cadre de carte (lon/lat) affiché dans le panneau des relations. */
const VIEW = { lon0: -14, lon1: 24, lat0: 35, lat1: 57 };
const PANEL = { x: 140, y: 470, w: 820, h: 0 };
PANEL.h = (PANEL.w * (VIEW.lat1 - VIEW.lat0)) / (VIEW.lon1 - VIEW.lon0);
const proj = (lon: number, lat: number) =>
  [
    // Un pays hors cadre (États-Unis) est ramené au bord gauche du panneau.
    Math.max(PANEL.x + 24, PANEL.x + ((lon - VIEW.lon0) / (VIEW.lon1 - VIEW.lon0)) * PANEL.w),
    PANEL.y + ((VIEW.lat1 - Math.max(lat, VIEW.lat0 + 3)) / (VIEW.lat1 - VIEW.lat0)) * PANEL.h,
  ] as const;
/** Principaux clients de la France, tels qu'affichés dans la fiche pays de l'app (capture). */
const PARTNERS = [
  { name: 'Allemagne', share: 12.6, ll: [13.4, 52.5] },
  // Hors cadre : l'arc part vers le bord gauche, côté Atlantique.
  { name: 'États-Unis', share: 8.2, ll: [-77, 49] },
  { name: 'Italie', share: 7.9, ll: [12.5, 41.9] },
  { name: 'Belgique', share: 7.5, ll: [4.35, 50.85] },
  { name: 'Espagne', share: 6.9, ll: [-3.7, 40.4] },
] as const;
const PARIS = [2.35, 48.85] as const;
/** Position des libellés (dx, dy, ancrage) : l'Europe est resserrée, chaque pays a sa place. */
const LABEL: Record<(typeof PARTNERS)[number]['name'], [number, number, 'start' | 'middle' | 'end']> = {
  Allemagne: [16, -10, 'start'],
  'États-Unis': [6, -18, 'start'],
  Italie: [16, 22, 'start'],
  Belgique: [0, -22, 'middle'],
  Espagne: [-14, 30, 'end'],
};

const Relations: React.FC<{ at: number; out: number }> = ({ at, out }) => {
  const f = useCurrentFrame();
  const k = Math.min(tween(f, at, at + s(0.8), 0, 1, EASE.out), tween(f, out - s(0.6), out, 1, 0, EASE.in));
  if (k <= 0) return null;
  const [px, py] = proj(...PARIS);
  const bgW = (PANEL.w * 360) / (VIEW.lon1 - VIEW.lon0);
  const bgH = bgW / 2;
  const bgX = -((VIEW.lon0 + 180) / 360) * bgW;
  const bgY = -((90 - VIEW.lat1) / 180) * bgH;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: k }}>
      <div
        style={{
          position: 'absolute',
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 24,
          overflow: 'hidden',
          background: '#0b1430',
          border: `1px solid ${IC.line}`,
        }}
      >
        <Img
          src={staticFile('textures/land-mask.png')}
          style={{
            position: 'absolute',
            left: bgX,
            top: bgY,
            width: bgW,
            height: bgH,
            opacity: 0.16,
            filter: 'sepia(1) hue-rotate(185deg) saturate(3)',
          }}
        />
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {PARTNERS.map((p, i) => {
          const a = at + s(0.8) + i * s(0.55);
          const t = tween(f, a, a + s(0.9), 0, 1, EASE.inOut);
          if (t <= 0) return null;
          const [x, y] = proj(p.ll[0], p.ll[1]);
          const mx = (px + x) / 2;
          const my = Math.min(py, y) - Math.hypot(x - px, y - py) * 0.35 - 20;
          const path = `M ${px} ${py} Q ${mx} ${my} ${x} ${y}`;
          const len = Math.hypot(x - px, y - py) * 1.4 + 60;
          return (
            <g key={p.name}>
              <path
                d={path}
                fill="none"
                stroke={IC.gold}
                strokeWidth={1.5 + p.share * 0.45}
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - t)}
                opacity={0.85}
              />
              <circle cx={x} cy={y} r={6 * t} fill={IC.gold} />
              <text
                x={x + LABEL[p.name][0]}
                y={y + LABEL[p.name][1]}
                textAnchor={LABEL[p.name][2]}
                fontFamily={FONT}
                fontSize={22}
                fontWeight={600}
                fill={IC.ink}
                opacity={tween(f, a + s(0.6), a + s(1), 0, 1)}
              >
                {p.name} · {p.share.toFixed(1).replace('.', ',')} %
              </text>
            </g>
          );
        })}
        <circle cx={px} cy={py} r={9} fill={IC.ink} />
        <text x={px - 16} y={py - 12} textAnchor="end" fontFamily={FONT} fontSize={24} fontWeight={800} fill={IC.ink}>
          France
        </text>
      </svg>
      <div
        style={{ position: 'absolute', left: PANEL.x, top: PANEL.y - 44, fontFamily: FONT, fontSize: 24, fontWeight: 700, color: IC.gold }}
      >
        {ICOPY.world.partnersTitle}
      </div>
      <div
        style={{
          position: 'absolute',
          left: PANEL.x,
          top: PANEL.y + PANEL.h + 14,
          fontFamily: FONT,
          fontSize: 17,
          fontWeight: 500,
          color: IC.faint,
        }}
      >
        {ICOPY.world.partnersNote}
      </div>
    </div>
  );
};

const World: React.FC = () => (
  <AbsoluteFill>
    <TextBlock eyebrow={ICOPY.world.eyebrow} title={ICOPY.world.title} bullets={ICOPY.world.bullets} at={s(0.3)} out={s(7.2)} y={240} />
    <FadeUp at={s(7.6)} style={{ position: 'absolute', left: 140, top: 150, width: 860, fontFamily: FONT }}>
      <div style={{ color: IC.gold, fontSize: 22, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 18 }}>
        {ICOPY.world.eyebrow}
      </div>
      <div style={{ color: IC.ink, fontSize: 46, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
        Chaque pays relié à ses partenaires, chiffres et sources à l’appui.
      </div>
    </FadeUp>
    <Relations at={s(8)} out={s(16)} />
    <Phone
      geom={G}
      at={0}
      screens={[
        { src: 'map-base', at: 0 },
        { src: 'map-exports', at: s(3.2) },
        { src: 'map-fra', at: s(5.4) },
        { src: 'fiche-fra', at: s(8.4), mode: 'push' },
        { src: 'fiche-fra-clients', at: s(10.6) },
      ]}
    >
      <Finger
        size={52}
        keys={[
          { f: s(2.4), x: 240, y: 200 },
          { f: s(2.9), x: 190, y: 72 },
          { f: s(3.0), x: 190, y: 72, down: true },
          { f: s(3.2), x: 190, y: 72, down: true },
          { f: s(4.6), x: 100, y: 250 },
          { f: s(5.2), x: 100, y: 250, down: true },
          { f: s(5.4), x: 100, y: 250, down: true },
          { f: s(7.6), x: 195, y: 792 },
          { f: s(8.2), x: 195, y: 792, down: true },
          { f: s(8.4), x: 195, y: 792, down: true },
          { f: s(9.6), x: 200, y: 640 },
          { f: s(9.8), x: 200, y: 640, down: true },
          { f: s(10.5), x: 200, y: 260, down: true },
          { f: s(10.8), x: 230, y: 300 },
        ]}
      />
    </Phone>
    <Lift
      geom={G}
      src="map-fra"
      rect={{ x: 10, y: 625, w: 370, h: 140 }}
      pos={[900, 850]}
      scale={1.1}
      at={s(5.9)}
      out={s(8.1)}
      label="Premier client : Allemagne"
    />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 07 progresser

const Progress: React.FC = () => (
  <AbsoluteFill>
    <TextBlock {...ICOPY.progress} at={s(0.3)} />
    <Phone geom={G} at={0} screens={[{ src: 'profil', at: 0 }]} />
    <Lift
      geom={G}
      src="profil"
      rect={{ x: 10, y: 578, w: 370, h: 115 }}
      pos={[860, 820]}
      scale={1.5}
      at={s(2.4)}
      out={s(7.6)}
      label="Les six grades de la carrière"
    />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ montage

const SCENES: Record<(typeof ISECTIONS)[number]['id'], React.FC> = {
  intro: () => <LogoScene />,
  problem: Problem,
  solution: Solution,
  learn: Learn,
  trade: Trade,
  sim: Sim,
  replay: Replay,
  hedge: Hedge,
  world: World,
  progress: Progress,
  outro: () => <LogoScene outro />,
};

/** Fondu enchaîné : chaque section commence un peu avant la fin de la précédente. */
const Fader: React.FC<{ dur: number; first: boolean; last: boolean; children: React.ReactNode }> = ({ dur, first, last, children }) => {
  const f = useCurrentFrame();
  const a = first ? 1 : tween(f, 0, s(XFADE), 0, 1, EASE.inOut);
  const b = last ? 1 : tween(f, s(dur), s(dur + XFADE), 1, 0, EASE.inOut);
  return <AbsoluteFill style={{ opacity: Math.min(a, b) }}>{children}</AbsoluteFill>;
};

export const Investor: React.FC = () => (
  <AbsoluteFill style={{ background: IC.bg }}>
    <Backdrop />
    {ISECTIONS.map((x, i) => {
      const Scene = SCENES[x.id];
      const from = s(ISTART[x.id]) - (i === 0 ? 0 : s(XFADE / 2));
      return (
        <Sequence key={x.id} name={x.id} from={from} durationInFrames={s(x.dur + XFADE)}>
          <Fader dur={x.dur} first={i === 0} last={i === ISECTIONS.length - 1}>
            <Scene />
          </Fader>
        </Sequence>
      );
    })}
    <Audio src={staticFile('audio/bips-investor.wav')} />
  </AbsoluteFill>
);

export const INVESTOR_FRAMES = s(ITOTAL);
