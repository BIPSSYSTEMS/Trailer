import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { IPhone } from './IPhone';
import { K } from './style';

/** Banc d'essai de l'iPhone : quatre angles côte à côte. */
export const PhoneLab: React.FC = () => {
  const f = useCurrentFrame();
  void f;
  const poses = [
    { cx: 260, rotY: 0 },
    { cx: 720, rotY: -28, rotX: 6 },
    { cx: 1180, rotY: 62 },
    { cx: 1640, rotY: 155 },
  ];
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      {poses.map((p, i) => (
        <IPhone key={i} pose={{ cy: 540, h: 820, ...p }} shots={[{ src: i % 2 ? 'options-fiche' : 'home', at: 0 }]} />
      ))}
    </AbsoluteFill>
  );
};
