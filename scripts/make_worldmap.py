"""Masque des terres émergées (équirectangulaire) pour la carte et le globe du trailer.

Source : world-atlas (Natural Earth 1:110m, domaine public), décodé depuis le TopoJSON.
Usage : python3 scripts/make_worldmap.py  → public/textures/land-mask.png (2048 x 1024, blanc = terre)
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
topo = json.loads((ROOT / 'node_modules/world-atlas/land-110m.json').read_text())
sx, sy = topo['transform']['scale']
tx, ty = topo['transform']['translate']

arcs = []
for arc in topo['arcs']:
    x = y = 0
    pts = []
    for dx, dy in arc:
        x += dx
        y += dy
        pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)


def ring(idx):
    pts = []
    for i in idx:
        a = arcs[i] if i >= 0 else arcs[~i][::-1]
        pts.extend(a if not pts else a[1:])
    return pts


W, H = 2048, 1024
img = Image.new('L', (W, H), 0)
d = ImageDraw.Draw(img)
to_px = lambda p: ((p[0] + 180) / 360 * W, (90 - p[1]) / 180 * H)
for geom in topo['objects']['land']['geometries']:
    polys = geom['arcs'] if geom['type'] == 'MultiPolygon' else [geom['arcs']]
    for poly in polys:
        for k, r in enumerate(poly):
            # Rend l'anneau continu à travers l'antiméridien, puis le dessine aussi décalé de ±360°.
            pts, off, prev = [], 0.0, None
            for lon, lat in ring(r):
                if prev is not None and abs(lon - prev) > 180:
                    off += 360 if prev > lon else -360
                pts.append((lon + off, lat))
                prev = lon
            for shift in (-360, 0, 360):
                d.polygon([to_px((x + shift, y)) for x, y in pts], fill=255 if k == 0 else 0)
out = ROOT / 'public/textures/land-mask.png'
img.save(out)
print(out)
