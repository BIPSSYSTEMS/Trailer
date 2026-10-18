import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import { FONT } from './theme';

for (const [file, weight] of [
  ['Inter-Bold.otf', '700'],
  ['Inter-ExtraBold.otf', '800'],
  ['Inter-Black.otf', '900'],
] as const) {
  loadFont({ family: FONT, url: staticFile(`fonts/${file}`), weight });
}
