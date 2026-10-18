#!/usr/bin/env bash
# Rend quelques images d'une composition et les assemble en planche (vérification visuelle).
# Usage : scripts/stills.sh <composition> <dossier sortie> <frame> [frame…]  (ajouter W=1920 H=1080 pour le 16:9)
set -e
comp=$1; out=$2; shift 2
mkdir -p "$out"
files=()
for f in "$@"; do
  npx remotion still "$comp" "$out/$comp-$f.png" --frame="$f" --log=error ${W:+--width=$W} ${H:+--height=$H}
  files+=("$out/$comp-$f.png")
done
python3 - "$out/$comp-sheet.png" "${files[@]}" <<'PY'
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in files]
w = 360 if ims[0].height > ims[0].width else 640
h = round(ims[0].height * w / ims[0].width)
sheet = Image.new('RGB', (w * len(ims), h + 24), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, files)):
    sheet.paste(im.resize((w, h)), (i * w, 24))
    d.text((i * w + 6, 5), f.rsplit('-', 1)[-1], fill=(255, 220, 120))
sheet.save(out)
print(out)
PY
