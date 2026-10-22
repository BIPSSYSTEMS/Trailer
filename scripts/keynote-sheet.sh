#!/usr/bin/env bash
# Planche d'images de la keynote à des instants donnés (secondes). Usage : scripts/keynote-sheet.sh <sortie.png> t1 t2 …
set -e
out=$1; shift
dir=$(mktemp -d -p "$(dirname "$out")")
for t in "$@"; do
  npx remotion still Keynote16x9 "$dir/$t.png" --frame=$(python3 -c "print(int($t*60))") --log=error
done
python3 - "$out" "$dir" "$@" <<'PY'
import sys
from PIL import Image, ImageDraw
out, d, ts = sys.argv[1], sys.argv[2], sys.argv[3:]
cols = 4
w, h = 480, 270
rows = -(-len(ts) // cols)
g = Image.new('RGB', (cols * w, rows * (h + 20)), (40, 40, 40))
dr = ImageDraw.Draw(g)
for i, t in enumerate(ts):
    x, y = (i % cols) * w, (i // cols) * (h + 20)
    g.paste(Image.open(f'{d}/{t}.png').convert('RGB').resize((w, h)), (x, y + 20))
    dr.text((x + 4, y + 4), f'{t}s', fill=(255, 220, 120))
g.save(out)
PY
echo "$dir"
