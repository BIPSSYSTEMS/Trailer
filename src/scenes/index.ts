import type React from 'react';
import type { SceneId } from '../timing';
import { S1Hook } from './S1Hook';
import { S2Logo } from './S2Logo';
import { S3Path } from './S3Path';

export const SCENE_COMPONENTS: Partial<Record<SceneId, React.FC>> = {
  hook: S1Hook,
  logo: S2Logo,
  path: S3Path,
};
