import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Slam } from './components/Kinetic';
import { Coin, Floor, GoldDust, Sprite } from './components/props3d';
import { Stage } from './components/Stage';
import { EASE } from './lib/anim';
import { camPath } from './lib/camera';
import { C } from './theme';

const cam = (f: number) =>
  camPath(
    [
      { f: 0, pos: [0, 3, 9], target: [0, 1.5, 0], fov: 45 },
      { f: 20, pos: [0, 3, 9], target: [0, 1.5, 0], fov: 45 },
      { f: 34, pos: [9, 3, 0], target: [0, 1.5, 0], fov: 45, ease: EASE.whip },
    ],
    f,
  );

export const Bench: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage cam={cam} textures={['assets/icons/bull.png', 'assets/icons/bear.png']}>
        <Floor />
        <GoldDust frame={f} />
        {Array.from({ length: 12 }, (_, i) => (
          <Coin key={i} position={[Math.cos(i) * 3, 1 + (i % 4), Math.sin(i) * 3]} rotation={[f * 0.05 + i, i, 0]} scale={0.6} />
        ))}
        <Sprite src="assets/icons/bull.png" position={[-1.5, 1.5, 0]} scale={2.4} />
        <Sprite src="assets/icons/bear.png" position={[1.5, 1.5, 0]} scale={2.4} />
      </Stage>
      <Slam text="EN JEU." at={10} />
    </AbsoluteFill>
  );
};
