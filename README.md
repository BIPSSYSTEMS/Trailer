# Trailer BIPS

Trailer de lancement de l'app BIPS (≈ 46 s, 128 BPM), rendu image par image avec Remotion + React Three Fiber.
Tout est dérivé de `useCurrentFrame()` : aucune animation en temps réel, aléatoire seedé, rendu identique à chaque passe.

## Commandes

```sh
npm install
npm run studio                 # prévisualisation interactive (Remotion Studio)
npm run render:9x16            # → out/bips-trailer-9x16.mp4 (1080×1920, 60 fps)
npm run render:16x9            # → out/bips-trailer-16x9.mp4 (1920×1080, 60 fps)
npm run audio                  # régénère la bande-son synthétique public/audio/bips-trailer.wav
scripts/stills.sh S4-career /tmp/st 60 240     # planche d'images clés d'une scène
```

Le rendu 3D passe par WebGL logiciel (`swangle`, voir `remotion.config.ts`) : il marche sans GPU, compter
≈ 1,3 s par image sur 4 cœurs.

## Où modifier quoi

| Fichier | Contenu |
| --- | --- |
| `src/copy.ts` | **Tous les textes** à l'écran (modifiables sans toucher aux scènes) |
| `src/timing.ts` | BPM, durée de chaque scène en temps, offset de la piste |
| `src/audio/cues.ts` | Partition des SFX et sections musicales (en temps) |
| `src/theme.ts` | Palette, police et métal du logo (`LOGO_METAL` : argent ou or) |
| `src/scenes/S1Hook.tsx` … `S9Finale.tsx`, `SAppTouch.tsx` | Une composition par scène (aussi rendables seules : `S1-hook`, `S4-app`, …) |
| `src/components/Touch.tsx` | Doigt animé (taps, glissés) pour les moments « app au toucher » |
| `src/Trailer.tsx` | Composition maître (scènes bout à bout + audio), utilisée en 9:16 et 16:9 |

### Changer de musique

Déposer la piste dans `public/audio/`, régler `BPM` et `OFFSET_FRAMES` dans `src/timing.ts`, passer `MUSIC`
à `false` dans `scripts/make-audio.ts` (on garde les SFX), relancer `npm run audio`, puis mixer la piste dans
`src/Trailer.tsx` avec un second `<Audio>`.

## Briques techniques

- `src/components/Stage.tsx` : toile 3D commune (bloom, aberration chromatique, vignette, brouillard) et
  **flou de mouvement caméra** calculé depuis la vitesse de la caméra entre deux images (directionnel pour les
  whip pans, radial pour les dolly), coupé automatiquement sur les coupes franches.
  En 16:9 le champ vertical vaut 80 % de celui du 9:16 (mêmes scènes, cadrage élargi).
- `@remotion/motion-blur` (`CameraMotionBlur`) pour les sorties rapides des calques 2D (dialogues, entretien).
- Matcaps « studio » précalculés (`scripts/make_matcaps.py`) pour l'or et le métal : rendu doré net et
  bien moins coûteux qu'un PBR avec cubemap en rendu logiciel.
- Logo BIPS extrudé à partir d'Inter Black (`scripts/make-typeface.mjs`), reflet balayé par shader.
- Carte et globe en points dorés à partir de Natural Earth (`scripts/make_worldmap.py`, domaine public).
- Aucun chiffre réel de marché : courbes stylisées sans graduations, valeurs de grecques illustratives.

## Assets

Les icônes, avatars et portraits viennent du dépôt de l'app (`BIPS-SYSTEME/assets`), où les planches
3 × 3 ont déjà été découpées et détourées. Le script les convertit en PNG et les renomme pour le trailer :

```sh
pip install -r scripts/requirements.txt
python3 scripts/prepare_assets.py import --app ../BIPS-SYSTEME   # copie + renommage → public/assets/
python3 scripts/prepare_assets.py contact                        # → public/assets/contact-sheet.png
```

Pour une nouvelle planche brute (fond gris clair, gouttières détectées automatiquement, détourage rembg) :

```sh
python3 scripts/prepare_assets.py cut --kind icons --sheet planche.png --names a,b,c,d,e,f,g,h,i
python3 scripts/prepare_assets.py cut --kind portraits --sheet planche.png --prefix man-hoodie
python3 scripts/prepare_assets.py cut --kind characters --sheet avatar.png --names man-hoodie
```

`public/assets/manifest.json` liste tous les fichiers.
