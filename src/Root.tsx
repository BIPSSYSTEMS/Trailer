import React from 'react';
import { Composition } from 'remotion';
import { SCENE_COMPONENTS } from './scenes';
import { FPS, SCENE_FRAMES, SCENES, TOTAL_FRAMES } from './timing';
import { Trailer } from './Trailer';
import { LogoLab } from './LogoLab';
import { PhoneLab } from './keynote/PhoneLab';
import { Keynote, Keynote2K, KEYNOTE_FRAMES } from './keynote/Keynote';
import { LogoBoard } from './keynote/LogoBoard';
import { Investor, INVESTOR_FRAMES } from './investor/Investor';

export const Root: React.FC = () => (
  <>
    <Composition id="Trailer9x16" component={Trailer} width={1080} height={1920} fps={FPS} durationInFrames={TOTAL_FRAMES} />
    <Composition id="Trailer16x9" component={Trailer} width={1920} height={1080} fps={FPS} durationInFrames={TOTAL_FRAMES} />
    <Composition id="Keynote16x9" component={Keynote} width={1920} height={1080} fps={60} durationInFrames={KEYNOTE_FRAMES} />
    <Composition id="Keynote2K" component={Keynote2K} width={2560} height={1440} fps={60} durationInFrames={KEYNOTE_FRAMES} />
    <Composition id="BasePointLogo" component={LogoBoard} width={1920} height={1300} fps={60} durationInFrames={1} />
    <Composition id="PhoneLab" component={PhoneLab} width={1920} height={1080} fps={60} durationInFrames={60} />
    <Composition id="Investor16x9" component={Investor} width={1920} height={1080} fps={FPS} durationInFrames={INVESTOR_FRAMES} />
    <Composition
      id="LogoLab"
      component={LogoLab}
      width={1080}
      height={1080}
      fps={FPS}
      durationInFrames={180}
      defaultProps={{ concept: 'pulse' as const }}
    />
    {SCENES.map((s, i) => {
      const C = SCENE_COMPONENTS[s.id];
      if (!C) return null;
      return (
        <Composition
          key={s.id}
          id={`S${i + 1}-${s.id}`}
          component={C}
          width={1080}
          height={1920}
          fps={FPS}
          durationInFrames={SCENE_FRAMES[s.id] + (s.id === 'finale' ? FPS : 0)}
        />
      );
    })}
  </>
);
