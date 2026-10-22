"""Matcaps « studio » précalculés pour les métaux du trailer (or, chrome, bronze).

Un matcap encode l'éclairage complet en fonction de la normale vue caméra : c'est le reflet d'un studio
(softbox en haut, bandes latérales, sol sombre avec rebond chaud) cuit dans une image. Bien moins cher
qu'un PBR avec cubemap en rendu logiciel, et rendu identique à chaque passe.

Usage : python3 scripts/make_matcaps.py   → public/textures/matcap-*.png
"""
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parents[1] / 'public' / 'textures'
N = 512


def studio(r):
    """Couleur (linéaire) du studio vue dans la direction r = (x, y, z), z vers la caméra."""
    x, y, z = r[..., 0], r[..., 1], r[..., 2]
    sky = np.clip(y, 0, 1)
    col = np.zeros(r.shape)
    # Fond : dégradé sol sombre → plafond moyen.
    col += (0.03 + 0.22 * sky ** 0.8)[..., None] * np.array([0.9, 0.95, 1.1])
    # Softbox principale en haut, légèrement vers l'arrière.
    soft = np.exp(-(((y - 0.78) / 0.16) ** 2) - ((x / 0.55) ** 2)) * 5.5
    col += soft[..., None] * np.array([1.0, 0.97, 0.9])
    # Bandes latérales (rim lights) : une chaude à gauche, une froide à droite.
    left = np.exp(-(((x + 0.86) / 0.1) ** 2) - ((y - 0.1) / 0.55) ** 2) * 3.2
    right = np.exp(-(((x - 0.86) / 0.1) ** 2) - ((y - 0.05) / 0.55) ** 2) * 2.4
    col += left[..., None] * np.array([1.0, 0.85, 0.6]) + right[..., None] * np.array([0.6, 0.75, 1.0])
    # Point chaud frontal (reflet de face, donne le « pop » sur les pièces).
    front = np.exp(-((x + 0.25) ** 2 + (y - 0.35) ** 2) / 0.02) * 4.0
    col += front[..., None]
    # Horizon : ligne claire fine.
    col += (np.exp(-((y + 0.02) / 0.04) ** 2) * 0.9)[..., None] * np.array([1.0, 0.95, 0.85])
    # Rebond chaud du sol.
    col += (np.clip(-y, 0, 1) * 0.12)[..., None] * np.array([1.0, 0.6, 0.25])
    return col


def matcap(tint, rough=0.0, fresnel_white=0.0):
    u = (np.arange(N) + 0.5) / N * 2 - 1
    X, Y = np.meshgrid(u, -u)
    R2 = X ** 2 + Y ** 2
    inside = R2 <= 1
    Z = np.sqrt(np.clip(1 - R2, 0, 1))
    n = np.stack([X, Y, Z], -1)
    v = np.array([0, 0, 1.0])
    r = 2 * (n @ v)[..., None] * n - v  # direction réfléchie
    col = studio(r)
    if rough:
        # Flou grossier par moyennage de directions voisines.
        acc = np.zeros_like(col)
        rs = np.random.default_rng(3)
        for _ in range(24):
            j = r + rs.normal(0, rough, 3)
            j /= np.linalg.norm(j, axis=-1, keepdims=True)
            acc += studio(j)
        col = acc / 24
    tint = np.array(tint)
    f = (1 - Z) ** 4
    col = col * (tint * (1 - f[..., None] * fresnel_white) + f[..., None] * fresnel_white)
    # Tonemapping doux + gamma sRGB.
    col = col / (1 + col * 0.35)
    col = np.clip(col, 0, 1) ** (1 / 2.2)
    img = np.zeros((N, N, 4))
    img[..., :3] = col
    img[..., 3] = 1
    img[~inside] = 0
    return Image.fromarray((img * 255).astype(np.uint8), 'RGBA')


OUT.mkdir(parents=True, exist_ok=True)
matcap([1.0, 0.72, 0.22], rough=0.05, fresnel_white=0.35).save(OUT / 'matcap-gold.png')
matcap([1.0, 0.62, 0.15], rough=0.18, fresnel_white=0.2).save(OUT / 'matcap-gold-satin.png')
matcap([0.85, 0.88, 0.95], rough=0.04, fresnel_white=0.3).save(OUT / 'matcap-chrome.png')
matcap([0.12, 0.13, 0.16], rough=0.08, fresnel_white=0.5).save(OUT / 'matcap-obsidian.png')
print('ok')
