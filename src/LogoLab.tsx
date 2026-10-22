import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { LogoByConcept, LogoConcept } from './components/LogoConcepts';
import { Floor, GoldDust } from './components/props3d';
import { Stage } from './components/Stage';
import { EASE, tween } from './lib/anim';
import { C, FONT } from './theme';

const NAMES: Record<LogoConcept, string> = {
  pulse: 'A · Le bip intégré',
  monogram: 'B · Monogramme + mot',
  premium: 'C · Wordmark premium',
};

/** Planche de présentation d'un concept de logo (tour lent, reflet qui balaie, tracé qui se dessine). */
export const LogoLab: React.FC<{ concept: LogoConcept }> = ({ concept }) => {
  const f = useCurrentFrame();
  const a = Math.sin(f * 0.012) * 0.35;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage cam={() => ({ pos: [Math.sin(a) * 7, 0.6, Math.cos(a) * 7], target: [0, 0.15, 0], fov: 34 })} bloom={1} fog={[9, 30]}>
        <Floor y={-1.6} mirror={0.85} />
        <LogoByConcept
          concept={concept}
          size={concept === 'monogram' ? 1 : 0.95}
          p={tween(f, 6, 50, 0, 1, EASE.out)}
          sweep={tween(f % 120, 20, 70, -1.2, 1.4, EASE.inOut)}
        />
        <GoldDust frame={f} count={200} spread={[14, 8, 10]} center={[0, 1, -3]} />
      </Stage>
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          width: '100%',
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 40,
          color: C.muted,
          letterSpacing: '0.1em',
        }}
      >
        {NAMES[concept]}
      </div>
    </AbsoluteFill>
  );
};
