import { CameraMotionBlur } from '@remotion/motion-blur';
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Flash } from '../components/Kinetic';
import { Banknote, Coin, GoldDust } from '../components/props3d';
import { Cam, Stage } from '../components/Stage';
import { COPY } from '../copy';
import { bf, EASE, lerp, noise1, rng, springAt, tween, useUnit } from '../lib/anim';
import { C, FONT } from '../theme';

type Who = 'me' | 'buddy' | 'director' | 'client';
const portrait = (who: Who, mood: string) => (who === 'me' ? `assets/portraits/man-suit-${mood}.png` : `assets/portraits/npc/${who}-${mood}.png`);

/** Expressions du bandeau de portraits, temps par temps (elles changent en rythme). */
const MOODS: Record<Who, [number, string][]> = {
  me: [[0, 'neutral'], [1.5, 'confident'], [4.5, 'smile'], [6.2, 'laugh']],
  buddy: [[0, 'smile'], [0.5, 'surprise'], [3.5, 'worried'], [5.5, 'laugh']],
  director: [[0, 'neutral'], [2.5, 'serious'], [4.6, 'smile']],
  client: [[0, 'neutral'], [2.6, 'surprise'], [3.5, 'worried'], [4.7, 'smile']],
};
const ORDER: Who[] = ['me', 'buddy', 'director', 'client'];
export const S5_PORTRAITS = ORDER.flatMap((w) => MOODS[w].map(([, m]) => portrait(w, m)));

const MSG_AT = COPY.dialogues.map((_, i) => bf(0.5 + i));
const T = { exit: bf(7), end: bf(8) };

const moodAt = (who: Who, f: number) => {
  let m = MOODS[who][0][1];
  let at = -100;
  for (const [b, mood] of MOODS[who]) if (f >= bf(b)) [m, at] = [mood, bf(b)];
  return { mood: m, at };
};

const cam = (f: number): Cam => ({
  pos: [Math.sin(f * 0.012) * 1.5, 0.5 + Math.sin(f * 0.02) * 0.3, 9 - f * 0.012],
  target: [0, 0, -4],
  fov: 50,
  roll: Math.sin(f * 0.015) * 0.04,
});

const Backdrop: React.FC<{ f: number }> = ({ f }) => {
  const r = rng(77);
  const items = Array.from({ length: 26 }, () => ({ x: (r() - 0.5) * 12, y: (r() - 0.5) * 14, z: -2 - r() * 14, s: 0.5 + r() * 0.8, ph: r() * 6, coin: r() > 0.55 }));
  return (
    <Stage cam={cam} bloom={0.9} fog={[6, 20]} motionBlur={0.6}>
      {items.map((it, i) => {
        const y = it.y + ((f * 0.01 * (1 + it.s)) % 14);
        const p: [number, number, number] = [it.x, ((y + 7) % 14) - 7, it.z];
        return it.coin ? (
          <Coin key={i} position={p} rotation={[f * 0.03 + it.ph, it.ph, 0]} scale={it.s * 0.45} />
        ) : (
          <Banknote key={i} position={p} rotation={[it.ph + f * 0.02, f * 0.025 + it.ph, it.ph]} scale={it.s} />
        );
      })}
      <GoldDust frame={f} count={200} spread={[14, 14, 14]} center={[0, 0, -6]} />
    </Stage>
  );
};

const Face: React.FC<{ who: Who; f: number; size: number; label: string }> = ({ who, f, size, label }) => {
  const { fps } = useVideoConfig();
  const u = useUnit();
  const { mood, at } = moodAt(who, f);
  const bounce = springAt(f, fps, at, { damping: 8, stiffness: 260, mass: 0.4 });
  const s = f - at < 30 ? lerp(1.22, 1, bounce) : 1;
  const speaking = COPY.dialogues.some((m, i) => m.who === who && f >= MSG_AT[i] && f < MSG_AT[i] + bf(0.9));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 * u, transform: `scale(${s})` }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 35%, #2b3a6b, #0d1430)',
          border: `${5 * u}px solid ${speaking ? C.goldHot : 'rgba(255,255,255,0.25)'}`,
          boxShadow: speaking ? `0 0 ${40 * u}px ${C.gold}` : `0 ${10 * u}px ${30 * u}px rgba(0,0,0,0.5)`,
        }}
      >
        <Img src={staticFile(portrait(who, mood))} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15) translateY(6%)' }} />
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26 * u, color: speaking ? C.goldHot : C.muted, letterSpacing: '0.04em' }}>{label}</div>
    </div>
  );
};

const LABELS: Record<Who, string> = { me: 'TOI', buddy: 'KENJI', director: 'DIRECTEUR', client: 'CLIENTE' };

const Thread: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const u = useUnit();
  const portraitMode = height > width;
  const panelW = Math.min(width * 0.94, 1000 * u);
  const bubbleH = 175 * u;
  const shown = MSG_AT.filter((a) => f >= a - 8).length;
  // Le fil remonte en douceur à chaque nouveau message.
  const scroll = MSG_AT.reduce((acc, a, i) => acc + (i >= 3 ? tween(f, a - 8, a + 6, 0, bubbleH, EASE.out) : 0), 0);
  const exit = tween(f, T.exit, T.end, 0, 1, EASE.in);
  const tiltY = lerp(16, -10, tween(f, 0, T.exit, 0, 1, EASE.inOut));
  return (
    <AbsoluteFill style={{ perspective: 1600 * u, alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: panelW,
          transform: `translateY(${-exit * height * 1.3}px) rotateY(${tiltY}deg) rotateX(${8 + exit * 30}deg) scale(${1 + exit * 0.3})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: (portraitMode ? 60 : 30) * u,
        }}
      >
        <div style={{ display: 'flex', gap: 34 * u }}>
          {ORDER.map((w) => (
            <Face key={w} who={w} f={f} size={(portraitMode ? 225 : 150) * u} label={LABELS[w]} />
          ))}
        </div>
        <div
          style={{
            width: '100%',
            height: (portraitMode ? 5.4 : 3.1) * bubbleH,
            overflow: 'hidden',
            borderRadius: 40 * u,
            background: 'rgba(10,14,28,0.72)',
            border: `${2 * u}px solid rgba(255,255,255,0.12)`,
            boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.6)`,
            padding: 24 * u,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ transform: `translateY(${-scroll}px)`, display: 'flex', flexDirection: 'column', gap: 18 * u }}>
            {COPY.dialogues.slice(0, shown).map((m, i) => {
              const me = m.who === 'me';
              const at = MSG_AT[i];
              const typing = f < at;
              const s = springAt(f, fps, at, { damping: 10, stiffness: 280, mass: 0.45 });
              const wob = noise1(f * 0.2, i) * 0.6;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 14 * u }}>
                  {!me && (
                    <Img
                      src={staticFile(portrait(m.who as Who, moodAt(m.who as Who, f).mood))}
                      style={{ width: 84 * u, height: 84 * u, borderRadius: '50%', objectFit: 'cover', background: '#1d2a55' }}
                    />
                  )}
                  <div
                    style={{
                      maxWidth: '74%',
                      padding: `${18 * u}px ${28 * u}px`,
                      borderRadius: 34 * u,
                      borderBottomRightRadius: me ? 8 * u : 34 * u,
                      borderBottomLeftRadius: me ? 34 * u : 8 * u,
                      background: me ? `linear-gradient(180deg, #2b9bff, ${C.bubbleMe})` : C.bubbleThem,
                      color: '#fff',
                      fontFamily: FONT,
                      fontWeight: 700,
                      fontSize: 54 * u,
                      lineHeight: 1.15,
                      transform: `scale(${typing ? 0.9 : lerp(0.3, 1, s)}) rotate(${typing ? 0 : (1 - s) * (me ? 6 : -6) + wob}deg)`,
                      transformOrigin: me ? 'bottom right' : 'bottom left',
                    }}
                  >
                    {typing ? (
                      <span style={{ letterSpacing: '0.2em', opacity: 0.7 }}>{['•  ', '••', '•••'][Math.floor(f / 4) % 3]}</span>
                    ) : (
                      <>
                        {!me && <div style={{ fontSize: 28 * u, fontWeight: 800, color: C.goldHot, marginBottom: 4 * u }}>{m.name.toUpperCase()}</div>}
                        {m.text}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const S5Dialogues: React.FC = () => {
  const f = useCurrentFrame();
  const flashIn = interpolate(f, [0, 6], [0.6, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Backdrop f={f} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(4,6,13,0.2), rgba(4,6,13,0.8))' }} />
      {f >= T.exit - 2 ? (
        <CameraMotionBlur samples={6} shutterAngle={200}>
          <Thread />
        </CameraMotionBlur>
      ) : (
        <Thread />
      )}
      <AbsoluteFill style={{ background: '#fff', opacity: flashIn }} />
      <Flash at={T.end - 3} len={3} peak={0.8} />
    </AbsoluteFill>
  );
};
