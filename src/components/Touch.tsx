import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { EASE } from '../lib/anim';

/** Clé de trajectoire du doigt : position (px dans le conteneur) et appui à la frame f. */
export type TouchKey = { f: number; x: number; y: number; down?: boolean };

const at = (keys: TouchKey[], f: number) => {
  if (f <= keys[0].f) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (f <= b.f) {
      const t = EASE.inOut((f - a.f) / Math.max(1, b.f - a.f));
      return { f, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, down: a.down && b.down };
    }
  }
  return keys[keys.length - 1];
};

/**
 * Indicateur de toucher (style captures d'app) : pastille blanche translucide qui suit une trajectoire,
 * s'écrase à l'appui, laisse une onde à chaque tap et une traînée pendant un glissé.
 * Visible de `keys[0].f` à la dernière clé (+ fondu).
 */
export const Finger: React.FC<{ keys: TouchKey[]; size?: number }> = ({ keys, size = 84 }) => {
  const frame = useCurrentFrame();
  const first = keys[0].f;
  const last = keys[keys.length - 1].f;
  if (frame < first - 6 || frame > last + 10) return null;
  const p = at(keys, frame);
  const opacity = interpolate(frame, [first - 6, first, last, last + 10], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Début de chaque appui : pour l'onde et l'écrasement.
  const presses = keys.filter((k, i) => k.down && !keys[i - 1]?.down).map((k) => k.f);
  const lastPress = presses.filter((f) => f <= frame).pop();
  const since = lastPress === undefined ? 99 : frame - lastPress;
  const squash = p.down ? 0.82 : 1 - Math.max(0, 0.18 - since * 0.04);
  // Traînée du glissé : quelques positions passées.
  const trail = p.down ? [3, 6, 9, 12].map((d) => at(keys, frame - d)).filter((q) => q.down) : [];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity }}>
      {trail.map((q, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: q.x - size * 0.3,
            top: q.y - size * 0.3,
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.35)',
            opacity: 0.5 - i * 0.11,
          }}
        />
      ))}
      {presses.map((f) =>
        frame >= f && frame < f + 18 ? (
          <div
            key={f}
            style={{
              position: 'absolute',
              left: keys.find((k) => k.f === f)!.x - size,
              top: keys.find((k) => k.f === f)!.y - size,
              width: size * 2,
              height: size * 2,
              borderRadius: '50%',
              border: `${size * 0.06}px solid rgba(255,255,255,0.9)`,
              boxShadow: `0 0 0 ${size * 0.02}px rgba(0,0,0,0.2)`,
              transform: `scale(${0.3 + ((frame - f) / 18) * 0.9})`,
              opacity: 1 - (frame - f) / 18,
            }}
          />
        ) : null,
      )}
      <div
        style={{
          position: 'absolute',
          left: p.x - size / 2,
          top: p.y - size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.95), rgba(220,225,235,0.75))',
          border: `${size * 0.04}px solid rgba(255,255,255,0.95)`,
          boxShadow: `0 0 0 ${size * 0.03}px rgba(0,0,0,0.28), 0 ${size * 0.12}px ${size * 0.35}px rgba(0,0,0,0.45), 0 0 ${size * 0.4}px rgba(255,255,255,0.35)`,
          transform: `scale(${squash})`,
        }}
      />
    </div>
  );
};
