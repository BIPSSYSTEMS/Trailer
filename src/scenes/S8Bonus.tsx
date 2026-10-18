import { CameraMotionBlur } from '@remotion/motion-blur';
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Flash, Slam } from '../components/Kinetic';
import { Burst, ContactBlob, Floor, GoldDust, Sprite } from '../components/props3d';
import { Cam, Stage } from '../components/Stage';
import { COPY } from '../copy';
import { bf, EASE, lerp, springAt, tween, useUnit } from '../lib/anim';
import { shake } from '../lib/camera';
import { useMatcap } from '../lib/materials';
import { C, FONT } from '../theme';

const CAR = 'assets/cars/sports-yellow.png';
const CAR_ASPECT = 840 / 563;
export const S8_TEXTURES = [CAR, 'assets/icons/key.png'];

const T = {
  xp: 2,
  full: bf(1.6),
  door: bf(2),
  unlocked: bf(2.6),
  interview: bf(3.75),
  answer: bf(5.5),
  daynight: bf(6),
  slide: bf(6.75),
  end: bf(8),
};

const camBase = (f: number): Cam => {
  const k = tween(f, 0, T.interview, 0, 1, EASE.linear);
  const a = lerp(-0.45, 0.35, k);
  const d = lerp(10.5, 6.2, tween(f, T.door, T.unlocked + 20, 0, 1, EASE.out));
  return { pos: [Math.sin(a) * d, lerp(1.6, 1.1, k), Math.cos(a) * d], target: [0, 0.9, 0], fov: 42 };
};
const cam = (f: number) => shake(camBase(f), f, f >= T.door ? 0.12 * Math.exp(-(f - T.door) / 8) : 0, 61);

const Garage: React.FC<{ f: number }> = ({ f }) => {
  const chrome = useMatcap('chrome', '#9aa3b5');
  const obsidian = useMatcap('obsidian', '#7a808f');
  const gold = useMatcap('gold');
  if (!chrome || !obsidian || !gold) return null;
  const lift = tween(f, T.door, T.door + 22, 0, 1, EASE.in);
  const turn = (f - T.door) * 0.012;
  return (
    <group>
      {/* Murs et toit du box. */}
      <mesh material={obsidian} position={[-2.3, 1.4, -1]}>
        <boxGeometry args={[0.2, 3.2, 4.4]} />
      </mesh>
      <mesh material={obsidian} position={[2.3, 1.4, -1]}>
        <boxGeometry args={[0.2, 3.2, 4.4]} />
      </mesh>
      <mesh material={obsidian} position={[0, 3.05, -1]}>
        <boxGeometry args={[4.8, 0.2, 4.4]} />
      </mesh>
      <mesh position={[0, 1.4, -3.15]}>
        <planeGeometry args={[4.4, 3.2]} />
        <meshBasicMaterial color="#0a1230" />
      </mesh>
      {/* Néons. */}
      {[-1.2, 0, 1.2].map((x) => (
        <mesh key={x} position={[x, 2.92, -1]}>
          <boxGeometry args={[0.8, 0.04, 0.12]} />
          <meshBasicMaterial color={f >= T.door ? '#fff6d8' : '#30364a'} toneMapped={false} />
        </mesh>
      ))}
      {/* Porte à lames qui remonte. */}
      {Array.from({ length: 8 }, (_, i) => {
        const y = 0.2 + i * 0.36 + lift * 3.2;
        if (y > 3.1) return null;
        return (
          <group key={i} position={[0, y, 1.2]}>
            <mesh material={obsidian}>
              <boxGeometry args={[4.4, 0.34, 0.08]} />
            </mesh>
            <mesh material={gold} position-z={0.05}>
              <boxGeometry args={[4.4, 0.025, 0.02]} />
            </mesh>
          </group>
        );
      })}
      {/* Plateau tournant + voiture. */}
      <mesh material={gold} position={[0, 0.02, -0.8]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.75, 1.85, 96]} />
      </mesh>
      <group position={[0, 0.85, -0.8]} rotation-y={Math.sin(turn) * 0.35}>
        <Sprite src={CAR} scale={1.7} aspect={CAR_ASPECT} shadow={false} thickness={0.03} emissive={f >= T.unlocked ? 0.08 : 0} />
      </group>
      <ContactBlob position={[0, 0.03, -0.75]} size={3.2} opacity={0.7} />
      {/* Clé dorée : tourne devant la porte puis s'y enfonce. */}
      {f < T.door + 2 && (
        <group position={[0, 1.4, lerp(2.2, 1.3, tween(f, T.full, T.door, 0, 1, EASE.in))]} rotation={[0, 0, tween(f, T.full, T.door, 0, -Math.PI / 2, EASE.inOut)]}>
          <Sprite src="assets/icons/key.png" scale={1.6} shadow={false} emissive={0.2} rotation={[0, Math.sin(f * 0.08) * 0.4, 0]} />
        </group>
      )}
      <spotLight position={[0, 2.8, 0.5]} angle={0.7} penumbra={0.6} intensity={f >= T.door ? 40 : 0} color="#ffe7b0" />
    </group>
  );
};

const XpBar: React.FC<{ f: number }> = ({ f }) => {
  const u = useUnit();
  const { fps } = useVideoConfig();
  if (f >= T.interview) return null;
  const s = springAt(f, fps, T.xp, { damping: 12 });
  const fill = tween(f, T.xp + 4, T.full, 0.28, 1, EASE.inOut);
  const full = f >= T.full;
  const out = tween(f, T.interview - 10, T.interview, 0, 1, EASE.in);
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '10%',
        width: 820 * u,
        transform: `translate(-50%, ${-out * 300 * u}px) scale(${s})`,
        display: 'flex',
        alignItems: 'center',
        gap: 20 * u,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          fontSize: 64 * u,
          fontWeight: 900,
          color: '#1a1200',
          background: `linear-gradient(180deg, ${C.goldHot}, ${C.goldDeep})`,
          borderRadius: 20 * u,
          padding: `${6 * u}px ${20 * u}px`,
          boxShadow: `0 0 ${full ? 60 : 20}px ${C.gold}`,
        }}
      >
        {COPY.bonus.xp}
      </div>
      <div style={{ flex: 1, height: 56 * u, borderRadius: 28 * u, background: 'rgba(255,255,255,0.1)', border: `${3 * u}px solid rgba(255,255,255,0.25)`, overflow: 'hidden' }}>
        <div
          style={{
            width: `${fill * 100}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${C.goldDeep}, ${C.goldHot}, #fff3c4)`,
            boxShadow: `0 0 ${30 * u}px ${C.gold}`,
          }}
        />
      </div>
    </div>
  );
};

/** Horloge : les aiguilles tournent 24 h en accéléré ; chaque superposition incrémente le compteur jusqu'à 22. */
const Interview: React.FC = () => {
  const f = useCurrentFrame();
  const u = useUnit();
  const { fps, width, height } = useVideoConfig();
  if (f < T.interview - 2 || f >= T.slide + 10) return null;
  const enter = tween(f, T.interview - 2, T.interview + 8, 0, 1, EASE.out);
  const t = tween(f, T.interview + 14, T.answer, 0, 1, EASE.inOut);
  const hours = t * 24;
  const minuteA = hours * 360;
  const hourA = hours * 30;
  const overlaps = Math.min(22, Math.floor((hours * 11) / 12 + 1e-6));
  const lastOverlap = ((overlaps * 12) / 11) / 24;
  const blink = t > 0 && t - lastOverlap < 0.012 && overlaps > 0;
  const portrait = height > width;
  const R = (portrait ? 230 : 170) * u;
  const ans = springAt(f, fps, T.answer, { damping: 9, stiffness: 200 });
  return (
    <AbsoluteFill
      style={{
        background: 'rgba(4,6,13,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateX(${(1 - enter) * width}px)`,
        fontFamily: FONT,
        gap: 40 * u,
        flexDirection: 'column',
        padding: 60 * u,
      }}
    >
      <div style={{ fontSize: 34 * u, fontWeight: 800, letterSpacing: '0.3em', color: C.goldHot }}>{COPY.bonus.interview}</div>
      <div style={{ fontSize: (portrait ? 62 : 52) * u, fontWeight: 900, color: '#fff', textAlign: 'center', maxWidth: 940 * u, lineHeight: 1.12 }}>
        {COPY.bonus.question}
      </div>
      <div style={{ position: 'relative', width: R * 2, height: R * 2 }}>
        <svg width={R * 2} height={R * 2} viewBox="-100 -100 200 200">
          <circle r="96" fill="#0d1836" stroke={blink ? C.green : C.goldHot} strokeWidth="4" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="0" y1="-84" x2="0" y2={i % 3 ? -76 : -70} stroke="#9fb0d9" strokeWidth={i % 3 ? 2 : 4} transform={`rotate(${i * 30})`} />
          ))}
          <line x1="0" y1="8" x2="0" y2="-48" stroke="#fff" strokeWidth="7" strokeLinecap="round" transform={`rotate(${hourA})`} />
          <line x1="0" y1="12" x2="0" y2="-78" stroke={C.goldHot} strokeWidth="4" strokeLinecap="round" transform={`rotate(${minuteA})`} />
          <circle r="6" fill={C.goldHot} />
          {blink && <circle r="96" fill={C.green} opacity="0.18" />}
        </svg>
        <div
          style={{
            position: 'absolute',
            right: -40 * u,
            top: -30 * u,
            minWidth: 120 * u,
            padding: `${8 * u}px ${18 * u}px`,
            borderRadius: 999,
            background: blink ? C.green : 'rgba(255,255,255,0.12)',
            color: '#fff',
            fontSize: 52 * u,
            fontWeight: 900,
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          ×{overlaps}
        </div>
      </div>
      {f >= T.answer && (
        <div
          style={{
            position: 'absolute',
            bottom: portrait ? '9%' : '4%',
            fontSize: 220 * u,
            fontWeight: 900,
            color: C.goldHot,
            textShadow: `0 0 ${60 * u}px ${C.gold}`,
            transform: `scale(${lerp(1.5, 1, ans)})`,
          }}
        >
          {COPY.bonus.answer}
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Mode jour → mode nuit d'un coup de glissière : un cercle sombre part de l'interrupteur et avale l'écran. */
const DayNight: React.FC<{ f: number }> = ({ f }) => {
  const u = useUnit();
  const { fps, width, height } = useVideoConfig();
  if (f < T.daynight) return null;
  const enter = tween(f, T.daynight, T.daynight + 10, 0, 1, EASE.out);
  const knob = springAt(f, fps, T.slide, { damping: 14, stiffness: 320, mass: 0.5 });
  const wipe = tween(f, T.slide + 2, T.slide + 18, 0, 1, EASE.in);
  const night = wipe > 0.5;
  const sw = { w: 440 * u, h: 210 * u };
  const cx = width / 2;
  const cy = height * 0.5;
  const ui = (dark: boolean) => (
    <AbsoluteFill style={{ background: dark ? '#0b0b0d' : '#f6f6f8', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, flexDirection: 'column', gap: 30 * u }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 860 * u,
            height: (i === 1 ? 120 : 90) * u,
            borderRadius: 28 * u,
            background: dark ? '#18181b' : '#ffffff',
            boxShadow: dark ? 'none' : `0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.08)`,
            border: `${2 * u}px solid ${dark ? '#26262a' : '#e7e7ec'}`,
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${30 * u}px`,
            gap: 20 * u,
            position: 'absolute',
            top: `${[22, 64, 76][i]}%`,
          }}
        >
          <div style={{ width: 50 * u, height: 50 * u, borderRadius: 14 * u, background: [C.gold, C.green, C.bubbleMe][i] }} />
          <div style={{ flex: 1, height: 18 * u, borderRadius: 9 * u, background: dark ? '#26262a' : '#e7e7ec' }} />
        </div>
      ))}
      <div style={{ position: 'absolute', top: '36%', fontSize: 120 * u, fontWeight: 900, color: dark ? '#f5f5f7' : '#0b0b0d' }}>{dark ? COPY.bonus.night : COPY.bonus.day}</div>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{ opacity: enter, transform: `scale(${lerp(1.15, 1, enter)})` }}>
      {ui(false)}
      <AbsoluteFill style={{ clipPath: `circle(${wipe * Math.hypot(width, height)}px at ${cx + sw.w / 4}px ${cy}px)` }}>{ui(true)}</AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: cx - sw.w / 2,
          top: cy - sw.h / 2,
          width: sw.w,
          height: sw.h,
          borderRadius: sw.h,
          background: night ? '#3b3b44' : '#e3e3e8',
          boxShadow: `0 0 ${night ? 50 : 0}px ${C.bubbleMe}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 10 * u,
            left: 10 * u + knob * (sw.w - sw.h),
            width: sw.h - 20 * u,
            height: sw.h - 20 * u,
            borderRadius: '50%',
            background: night ? '#f5f5f7' : '#ffffff',
            boxShadow: `0 ${6 * u}px ${16 * u}px rgba(0,0,0,0.25)`,
            fontSize: 90 * u,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {night ? '☾' : '☀'}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const S8Bonus: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {f < T.daynight + 12 && (
        <Stage cam={cam} textures={S8_TEXTURES} bloom={1.1} fog={[8, 26]}>
          <Floor y={0} mirror={0.8} />
          <Garage f={f} />
          <Burst frame={f} at={T.unlocked} position={[0, 1.2, 0]} count={220} speed={12} life={50} seed={81} />
          <GoldDust frame={f} count={160} spread={[10, 6, 8]} center={[0, 2, 0]} />
        </Stage>
      )}
      <XpBar f={f} />
      <Slam text={COPY.bonus.levelUp} at={T.full} out={T.door + 10} y={-0.28} size={92} glow="rgba(255,190,60,1)" />
      {f >= T.unlocked && f < T.interview && (
        <Slam text={COPY.bonus.unlocked} at={T.unlocked} out={T.interview - 6} y={0.3} size={140} color={C.green} glow="rgba(34,224,122,0.9)" />
      )}
      {f >= T.interview - 2 && f < T.interview + 12 ? (
        <CameraMotionBlur samples={5} shutterAngle={240}>
          <Interview />
        </CameraMotionBlur>
      ) : (
        <Interview />
      )}
      <DayNight f={f} />
      <Flash at={T.full} len={8} peak={0.5} />
      <Flash at={T.door} len={6} peak={0.3} />
      <Flash at={T.answer} len={6} color={C.gold} peak={0.4} />
    </AbsoluteFill>
  );
};
