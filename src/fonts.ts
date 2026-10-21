import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import { FONT } from './theme';

for (const [file, weight] of [
  ['Inter-Regular.otf', '400'],
  ['Inter-Medium.otf', '500'],
  ['Inter-SemiBold.otf', '600'],
  ['Inter-Bold.otf', '700'],
  ['Inter-ExtraBold.otf', '800'],
  ['Inter-Black.otf', '900'],
] as const) {
  loadFont({ family: FONT, url: staticFile(`fonts/${file}`), weight });
}

// Vidéo keynote Base Point : Inter Display (titres) et Inter (texte courant).
for (const [file, weight] of [
  ['InterDisplay-Light.otf', '300'],
  ['InterDisplay-Regular.otf', '400'],
  ['InterDisplay-Medium.otf', '500'],
  ['InterDisplay-SemiBold.otf', '600'],
  ['InterDisplay-Bold.otf', '700'],
] as const) {
  loadFont({ family: 'KDisplay', url: staticFile(`fonts/${file}`), weight });
}
