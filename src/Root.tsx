import React from 'react';
import { Composition } from 'remotion';
import { Bench } from './Bench';
import { SCENE_COMPONENTS } from './scenes';
import { FPS, SCENE_FRAMES, SCENES } from './timing';

export const Root: React.FC = () => (
  <>
    {SCENES.map((s, i) => {
      const C = SCENE_COMPONENTS[s.id];
      if (!C) return null;
      const id = `S${i + 1}-${s.id}`;
      return <Composition key={s.id} id={id} component={C} width={1080} height={1920} fps={FPS} durationInFrames={SCENE_FRAMES[s.id]} />;
    })}
    <Composition id="Bench" component={Bench} width={1080} height={1920} fps={60} durationInFrames={60} />
  </>
);
