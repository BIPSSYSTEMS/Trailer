import type React from 'react';
import type { SceneId } from '../timing';
import { S1Hook } from './S1Hook';
import { S2Logo } from './S2Logo';
import { S3Path } from './S3Path';
import { S4Career } from './S4Career';
import { S5Dialogues } from './S5Dialogues';
import { S6Scenarios } from './S6Scenarios';
import { S7Markets } from './S7Markets';
import { S8Bonus } from './S8Bonus';
import { S9Finale } from './S9Finale';
import { SAppTouch } from './SAppTouch';

export const SCENE_COMPONENTS: Partial<Record<SceneId, React.FC>> = {
  hook: S1Hook,
  logo: S2Logo,
  path: S3Path,
  app: SAppTouch,
  career: S4Career,
  dialogues: S5Dialogues,
  scenarios: S6Scenarios,
  markets: S7Markets,
  bonus: S8Bonus,
  finale: S9Finale,
};
