"""Met chaque capture brute (390 × 756 pt, 3×) au format d'un écran d'iPhone (390 × 844 pt).

Ajoute 54 pt en haut (zone de la barre d'état et de la Dynamic Island) et 34 pt en bas (indicateur d'accueil),
remplis avec la couleur du bord de la capture. Écrit aussi screens.json : thème clair ou sombre de chaque écran,
pour dessiner l'heure et les icônes de la barre d'état dans la bonne couleur.

Usage : python3 scripts/frame_screens.py <dossier brut>  → public/keynote-screens/
"""
import json
import sys
from pathlib import Path

from PIL import Image

RAW = Path(sys.argv[1])
OUT = Path(__file__).resolve().parents[1] / 'public' / 'keynote-screens'
OUT.mkdir(parents=True, exist_ok=True)
TOP, BOTTOM = 54 * 3, 34 * 3
meta = {}
for f in sorted(RAW.glob('*.png')):
    im = Image.open(f).convert('RGB')
    w, h = im.size
    top = im.getpixel((w // 2, 2))
    bottom = im.getpixel((w // 2, h - 2))
    out = Image.new('RGB', (w, h + TOP + BOTTOM), top)
    out.paste(Image.new('RGB', (w, BOTTOM), bottom), (0, h + TOP))
    out.paste(im, (0, TOP))
    out.save(OUT / f'{f.stem}.jpg', quality=90, optimize=True)
    lum = 0.299 * top[0] + 0.587 * top[1] + 0.114 * top[2]
    meta[f.stem] = {'dark': lum < 110}
(OUT / 'screens.json').write_text(json.dumps(meta, indent=1) + '\n')
print(len(meta), 'écrans →', OUT)
