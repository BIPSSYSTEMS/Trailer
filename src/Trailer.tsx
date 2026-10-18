import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { SCENE_COMPONENTS } from './scenes';
import { C } from './theme';
import { FPS, SCENE_FRAMES, SCENE_START, SCENES } from './timing';

/** Composition maître : les scènes bout à bout sur la grille de temps, et la bande-son. */
export const Trailer: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    {SCENES.map((s) => {
      const Scene = SCENE_COMPONENTS[s.id];
      if (!Scene) return null;
      const tail = s.id === 'finale' ? FPS : 0;
      return (
        <Sequence key={s.id} name={s.id} from={SCENE_START[s.id]} durationInFrames={SCENE_FRAMES[s.id] + tail}>
          <Scene />
        </Sequence>
      );
    })}
    <Audio src={staticFile('audio/bips-trailer.wav')} />
  </AbsoluteFill>
);
