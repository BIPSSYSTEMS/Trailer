# Trailer BIPS

Trailer de lancement de l'app BIPS, rendu image par image avec Remotion + React Three Fiber.

## Étape 1 — assets

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

`public/assets/manifest.json` liste tous les fichiers ; les scènes le lisent.
