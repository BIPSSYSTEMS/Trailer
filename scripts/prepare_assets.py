"""Préparation des assets du trailer BIPS.

Trois commandes :

  import   Copie les assets déjà découpés et détourés du dépôt de l'app (BIPS-SYSTEME/assets),
           les convertit en PNG et les renomme pour le trailer.
             python3 scripts/prepare_assets.py import --app ../bips-systeme

  cut      Découpe des planches 3 x 3 brutes (fond gris clair) en 9 PNG détourés.
           Les gouttières sont détectées automatiquement (pas de coordonnées codées en dur).
             python3 scripts/prepare_assets.py cut --kind icons --sheet planche.png \
                 --names gold-bars,bull,bear,rocket,vault,black-swan,oil-barrel,trophy,globe
             python3 scripts/prepare_assets.py cut --kind portraits --sheet planche.png --prefix man-hoodie
           --kind characters détoure une image en pied (une par grade) : --names man-hoodie

  contact  Construit la planche-contact public/assets/contact-sheet.png à partir du manifeste.

Tout est écrit dans public/assets/ et listé dans public/assets/manifest.json (lu par les scènes).
"""
import argparse
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'assets'

# Nom dans l'app → nom dans le trailer. L'ordre suit les planches d'origine (7 planches 3 x 3).
ICONS = {
    'money_gun': 'money-gun', 'terminal': 'trading-keyboard', 'chandeliers': 'candlesticks',
    'baril': 'oil-barrel', 'lingots': 'gold-bars', 'aigle': 'eagle',
    'taureau': 'bull', 'ours': 'bear', 'pile_pieces': 'coin-stack',

    'coffre_fort': 'vault', 'fusee': 'rocket', 'cloche': 'opening-bell',
    'mallette': 'briefcase', 'globe': 'globe', 'calculatrice': 'calculator',
    'tirelire': 'piggy-bank', 'trophee': 'trophy', 'diamant': 'diamond',

    'gouverneur': 'central-banker', 'politicien': 'politician', 'gouverneure': 'central-banker-woman',
    'trader_crie': 'trader-shouting', 'analyste': 'analyst', 'banquier': 'banker',
    'broker': 'broker', 'mascotte_taureau': 'bull-mascot', 'mascotte_ours': 'bear-mascot',

    'plateforme': 'oil-rig', 'taureau_ours': 'bull-vs-bear', 'ticker': 'ticker',
    'balance': 'scales', 'piece_roule': 'rolling-coin', 'horloge_taux': 'rate-clock',
    'banque': 'bank', 'planche_billets': 'money-printer', 'robinet': 'liquidity-tap',

    'ble': 'wheat', 'cafe': 'coffee', 'solaire': 'solar-panel',
    'eolienne': 'wind-turbine', 'baril_deborde': 'overflowing-barrel', 'cygne_noir': 'black-swan',
    'parachute': 'parachute', 'bouee': 'lifebuoy', 'popcorn': 'popcorn',

    'tank': 'tank', 'avion': 'plane', 'drapeau_us': 'flag-us',
    'drapeau_ue': 'flag-eu', 'drapeau_jp': 'flag-jp', 'drapeau_uk': 'flag-uk',
    'drapeau_cn': 'flag-cn', 'trader_hausse': 'trader-cheering', 'carton': 'fired-trader',

    'tonneau_billets': 'cash-barrel', 'tresor': 'treasure-chest', 'arc_pieces': 'coin-arc',
    'drapeau_etape': 'checkpoint-flag', 'cle': 'key', 'parapluie': 'umbrella',
    'ampoule': 'lightbulb', 'medaille': 'medal', 'sablier': 'hourglass',
}
# Tenues dans l'ordre de la carrière (hoodie à badge → manteau).
OUTFITS = {'sweat': 'hoodie', 'chemise': 'shirt', 'blazer': 'blazer',
           'costume': 'suit', 'troispieces': 'three-piece', 'manteau': 'coat'}
GENDERS = {'h': 'man', 'f': 'woman'}
# Ordre des cases sur les planches d'expressions (gauche → droite, haut → bas).
MOODS = {'neutre': 'neutral', 'sourire': 'smile', 'rire': 'laugh',
         'surprise': 'surprise', 'concentre': 'serious', 'inquiet': 'worried',
         'tristesse': 'sad', 'colere': 'angry', 'clin': 'confident'}
# Personnages secondaires de l'app (têtes seules) : collègues et clients.
NPCS = {'kenji': 'buddy', 'aicha': 'colleague', 'marianne': 'client', 'gabriel': 'director'}
CARS = {
    'sportive_jaune': 'sports-yellow', 'roadster_azur': 'roadster-azure', 'coupe_bordeaux': 'coupe-burgundy',
    'cabriolet_corail': 'convertible-coral', 'berline_graphite': 'sedan-graphite', 'berline_ardoise': 'sedan-slate',
    'berline_classique_creme': 'sedan-classic-cream', 'break_bleu_petrole': 'wagon-petrol-blue',
    'suv_compact_cuivre': 'suv-compact-copper', 'suv_tout_terrain_ivoire': 'suv-offroad-ivory',
    'pickup_rouge_brique': 'pickup-brick-red', 'compacte_retro_moutarde': 'compact-retro-mustard',
    'citadine_sauge': 'city-car-sage', 'microcar_electrique_menthe': 'microcar-electric-mint',
}


def save_png(im: Image.Image, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.convert('RGBA').save(dst, 'PNG', optimize=True)


def rel(p: Path) -> str:
    return p.relative_to(OUT).as_posix()


# ---------------------------------------------------------------- import

def cmd_import(args) -> None:
    app = Path(args.app) / 'assets'
    for sub in ('icons', 'characters', 'portraits', 'cars', 'brand'):
        shutil.rmtree(OUT / sub, ignore_errors=True)
    manifest = {'icons': [], 'characters': {}, 'portraits': {}, 'npcs': {}, 'cars': [], 'brand': {}}

    for src, name in ICONS.items():
        dst = OUT / 'icons' / f'{name}.png'
        save_png(Image.open(app / 'path-icons' / f'{src}.webp'), dst)
        manifest['icons'].append({'id': name, 'file': rel(dst)})

    for g, gname in GENDERS.items():
        manifest['characters'][gname] = []
        manifest['portraits'][gname] = {}
        for o, oname in OUTFITS.items():
            dst = OUT / 'characters' / f'{gname}-{oname}.png'
            save_png(Image.open(app / 'avatars' / f'{g}-{o}.webp'), dst)
            manifest['characters'][gname].append({'outfit': oname, 'file': rel(dst)})
            moods = {}
            for m, mname in MOODS.items():
                dst = OUT / 'portraits' / f'{gname}-{oname}-{mname}.png'
                save_png(Image.open(app / 'bustes' / f'{g}-{o}-{m}.webp'), dst)
                moods[mname] = rel(dst)
            manifest['portraits'][gname][oname] = moods

    for n, role in NPCS.items():
        moods = {}
        for m, mname in MOODS.items():
            dst = OUT / 'portraits' / 'npc' / f'{role}-{mname}.png'
            save_png(Image.open(app / 'characters' / f'{n}-{m}.webp'), dst)
            moods[mname] = rel(dst)
        manifest['npcs'][role] = moods

    for src, name in CARS.items():
        dst = OUT / 'cars' / f'{name}.png'
        save_png(Image.open(app / 'cars' / f'{src}.webp'), dst)
        manifest['cars'].append({'id': name, 'file': rel(dst)})

    dst = OUT / 'brand' / 'app-icon.png'
    save_png(Image.open(app / 'icon.png'), dst)
    manifest['brand']['appIcon'] = rel(dst)

    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    print(f"{len(manifest['icons'])} icônes, {sum(len(v) for v in manifest['characters'].values())} avatars, "
          f"{sum(len(o) * 9 for o in manifest['portraits'].values())} portraits, {len(NPCS) * 9} portraits PNJ, "
          f"{len(CARS)} voitures")


# ---------------------------------------------------------------- cut

def find_cells(sheet: Image.Image, n: int = 3) -> tuple[list[tuple[int, int]], list[tuple[int, int]]]:
    """Bornes des colonnes et des lignes d'une planche n x n, gouttières exclues.

    Une gouttière est une bande quasi uniforme (faible écart-type sur toute la hauteur ou largeur)
    dont la teinte diffère du fond des cases. On la cherche autour de chaque tiers de la planche.
    """
    g = np.asarray(sheet.convert('L'), dtype=np.float32)

    def bounds(axis: int) -> list[tuple[int, int]]:
        size = g.shape[1 - axis]
        std = g.std(axis=axis)
        mean = g.mean(axis=axis)
        background = np.median(mean)
        # Score faible = ligne uniforme ET éloignée du fond (bord ou trait de séparation).
        score = std - 0.5 * np.abs(mean - background)
        cuts = []
        for k in range(1, n):
            centre = size * k // n
            lo, hi = centre - size // 12, centre + size // 12
            c = lo + int(np.argmin(score[lo:hi]))
            # Étend la gouttière tant que le profil reste proche de son minimum.
            thr = score[c] + max(2.0, 0.15 * abs(score[c]))
            a = c
            while a > lo and score[a - 1] <= thr:
                a -= 1
            b = c
            while b < hi - 1 and score[b + 1] <= thr:
                b += 1
            cuts.append((a, b + 1))
        edges = [0] + [x for cut in cuts for x in cut] + [size]
        return [(edges[2 * i], edges[2 * i + 1]) for i in range(n)]

    return bounds(0), bounds(1)


_session = None


def detour(im: Image.Image) -> Image.Image:
    global _session
    from rembg import new_session, remove
    if _session is None:
        _session = new_session('isnet-general-use')
    out = np.array(remove(im.convert('RGB'), session=_session, post_process_mask=True))
    # Supprime le halo très faible laissé sur le fond clair.
    out[..., 3][out[..., 3] < 16] = 0
    return Image.fromarray(out)


def square_on_object(im: Image.Image, side: int, margin: float = 1.08) -> Image.Image:
    obj = im.crop(im.getbbox())
    s = int(max(obj.size) * margin)
    canvas = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    canvas.paste(obj, ((s - obj.width) // 2, (s - obj.height) // 2))
    return canvas.resize((side, side), Image.LANCZOS)


def cmd_cut(args) -> None:
    sheet = Image.open(args.sheet).convert('RGB')
    if args.kind == 'characters':
        im = detour(sheet)
        save_png(im.crop(im.getbbox()), OUT / 'characters' / f'{args.names}.png')
        return
    cols, rows = find_cells(sheet)
    print('colonnes', cols, 'lignes', rows)
    names = args.names.split(',') if args.names else [f'{args.prefix}-{m}' for m in MOODS.values()]
    assert len(names) == 9, 'il faut 9 noms (gauche → droite, haut → bas)'
    inset = 6
    for i, name in enumerate(names):
        (x0, x1), (y0, y1) = cols[i % 3], rows[i // 3]
        if args.kind == 'icons':
            cell = detour(sheet.crop((x0 + inset, y0 + inset, x1 - inset, y1 - inset)))
            save_png(square_on_object(cell, 512), OUT / 'icons' / f'{name}.png')
        else:
            # Portraits : carré ancré en bas de la case (là où sont les épaules).
            s = min(x1 - x0, y1 - y0)
            left = x0 + (x1 - x0 - s) // 2
            cell = sheet.crop((left + inset, y1 - s + inset, left + s - inset, y1 - inset))
            save_png(detour(cell).resize((512, 512), Image.LANCZOS), OUT / 'portraits' / f'{name}.png')
        print(name)


# ---------------------------------------------------------------- contact

BG = (8, 11, 20)
CARD = (17, 22, 36)
GOLD = (242, 192, 64)
MUTED = (140, 150, 175)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    for f in ('/usr/share/fonts/opentype/inter/Inter-Bold.otf' if bold else '/usr/share/fonts/opentype/inter/Inter-Medium.otf',
              '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'):
        if Path(f).exists():
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def fit(im: Image.Image, w: int, h: int) -> Image.Image:
    im = im.convert('RGBA')
    im.thumbnail((w, h), Image.LANCZOS)
    return im


def cmd_contact(args) -> None:
    m = json.loads((OUT / 'manifest.json').read_text())
    W, PAD = 2400, 40
    blocks = []  # (titre, liste de (image, légende), largeur tuile, hauteur image, colonnes)
    blocks.append(('ICÔNES — public/assets/icons/', [(OUT / i['file'], i['id']) for i in m['icons']], 9, 200))
    chars = [(OUT / c['file'], f"{g}-{c['outfit']}") for g in m['characters'] for c in m['characters'][g]]
    blocks.append(('AVATARS EN PIED (grade 1 → 6) — public/assets/characters/', chars, 12, 380))
    for g, outfits in m['portraits'].items():
        items = [(OUT / f, f'{o} · {mood}') for o, moods in outfits.items() for mood, f in moods.items()]
        blocks.append((f'PORTRAITS {g.upper()} (tenue × expression) — public/assets/portraits/{g}-<tenue>-<expression>.png',
                       items, 18, 110))
    npc = [(OUT / f, f'{role} · {mood}') for role, moods in m['npcs'].items() for mood, f in moods.items()]
    blocks.append(('PERSONNAGES SECONDAIRES — public/assets/portraits/npc/<rôle>-<expression>.png', npc, 18, 110))
    blocks.append(('VOITURES (scène bonus) — public/assets/cars/', [(OUT / c['file'], c['id']) for c in m['cars']], 7, 150))

    title_f, label_f, small_f = font(30, True), font(15), font(11)
    layouts, H = [], 150
    for title, items, cols, ih in blocks:
        tw = (W - 2 * PAD) // cols
        lab = 26 if cols <= 12 else 18
        rows = -(-len(items) // cols)
        layouts.append((title, items, cols, ih, tw, lab, H))
        H += 60 + rows * (ih + lab + 14) + 30
    sheet = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(sheet)
    d.text((PAD, 40), 'BIPS — TRAILER · PLANCHE-CONTACT DES ASSETS', font=font(44, True), fill=GOLD)
    d.text((PAD, 98), f"{len(m['icons'])} icônes · 12 avatars · 108 portraits · 36 PNJ · {len(m['cars'])} voitures"
                      ' · fond = couleur du trailer (vérifie les halos de détourage)', font=label_f, fill=MUTED)
    for title, items, cols, ih, tw, lab, y in layouts:
        d.text((PAD, y + 10), title, font=title_f if cols <= 12 else font(24, True), fill=(235, 238, 245))
        y += 60
        for i, (path, caption) in enumerate(items):
            x = PAD + (i % cols) * tw
            yy = y + (i // cols) * (ih + lab + 14)
            d.rounded_rectangle((x + 3, yy, x + tw - 3, yy + ih + lab), radius=10, fill=CARD)
            im = fit(Image.open(path), tw - 14, ih - 8)
            sheet.paste(im, (x + (tw - im.width) // 2, yy + 4 + (ih - 8 - im.height) // 2), im)
            f = label_f if cols <= 12 else small_f
            w = d.textlength(caption, font=f)
            d.text((x + (tw - w) / 2, yy + ih + 2), caption, font=f, fill=GOLD if cols <= 12 else MUTED)
    dst = OUT / 'contact-sheet.png'
    sheet.save(dst, optimize=True)
    print(dst, sheet.size)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest='cmd', required=True)
    s = sub.add_parser('import'); s.add_argument('--app', required=True); s.set_defaults(fn=cmd_import)
    s = sub.add_parser('cut')
    s.add_argument('--kind', choices=['icons', 'portraits', 'characters'], required=True)
    s.add_argument('--sheet', required=True)
    s.add_argument('--names', help='9 noms séparés par des virgules (icônes), ou 1 nom (characters)')
    s.add_argument('--prefix', help='portraits : préfixe <genre>-<tenue>, les 9 expressions sont ajoutées')
    s.set_defaults(fn=cmd_cut)
    s = sub.add_parser('contact'); s.set_defaults(fn=cmd_contact)
    args = p.parse_args()
    args.fn(args)


if __name__ == '__main__':
    main()
