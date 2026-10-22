"""Voix off de la keynote Base Point : synthèse (Piper, voix neuronale française), placement, mixage avec la musique.

La musique baisse de 9 dB pendant que la voix parle (ducking), puis remonte doucement.
Le script signale toute réplique qui déborde sur la suivante.

Usage :
  pip install piper-tts
  python3 scripts/make_voiceover.py <voix.onnx> [--speaker N] [--speed 1.0] [--out public/audio/base-point-keynote-voix.wav]
Puis remonter le son sur la vidéo sans refaire l'image :
  ffmpeg -i out/base-point-keynote-16x9.mp4 -i public/audio/base-point-keynote-voix.wav \\
         -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k out/base-point-keynote-16x9-voix.mp4
"""
import argparse
import json
import wave
from pathlib import Path

import numpy as np
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parents[1]
SR = 48000

ap = argparse.ArgumentParser()
ap.add_argument('voice')
ap.add_argument('--speaker', type=int, default=None)
ap.add_argument('--speed', type=float, default=1.0, help='> 1 = plus lent')
ap.add_argument('--music', default=str(ROOT / 'public/audio/base-point-keynote.wav'))
ap.add_argument('--lines', default=str(ROOT / 'src/keynote/voix.json'))
ap.add_argument('--out', default=str(ROOT / 'public/audio/base-point-keynote-voix.wav'))
ap.add_argument('--voice-only', default=None, help='écrit aussi la voix seule (pour un aperçu)')
ap.add_argument('--duck', type=float, default=0.35, help='gain de la musique pendant la voix')
ap.add_argument('--timings', default=None, help='écrit le minutage réel de chaque phrase (pour caler les sous-titres)')
args = ap.parse_args()

voice = PiperVoice.load(args.voice)
cfg = SynthesisConfig(speaker_id=args.speaker, length_scale=args.speed, noise_scale=0.6, noise_w_scale=0.75)


def synth(text: str) -> tuple[np.ndarray, list[tuple[float, float]]]:
    """Voix à 48 kHz, et pour chaque phrase (Piper découpe par phrase) le début et la fin de la parole, en s."""
    chunks = list(voice.synthesize(text, cfg))
    sr = chunks[0].sample_rate
    sentences, pos = [], 0
    for c in chunks:
        a = c.audio_float_array
        idx = np.where(np.abs(a) > 0.02)[0]
        if len(idx):
            sentences.append(((pos + idx[0]) / sr, (pos + idx[-1]) / sr))
        pos += len(a)
    x = np.concatenate([c.audio_float_array for c in chunks]).astype(np.float64)
    # Rééchantillonnage linéaire vers 48 kHz (suffisant pour la voix).
    n = int(len(x) * SR / sr)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x), sentences


with wave.open(args.music) as w:
    assert w.getframerate() == SR and w.getnchannels() == 2
    music = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, 2).astype(np.float64) / 32767

lines = json.loads(Path(args.lines).read_text())['lines']
N = len(music)
vo = np.zeros(N)
spans = []
timings = []
for i, ln in enumerate(lines):
    a, sentences = synth(ln['text'])
    timings.append({'t': ln['t'], 'sentences': [[round(ln['t'] + s0, 3), round(ln['t'] + s1, 3)] for s0, s1 in sentences]})
    # Petite enveloppe pour éviter les clics.
    fade = min(len(a) // 4, int(0.01 * SR))
    a[:fade] *= np.linspace(0, 1, fade)
    a[-fade:] *= np.linspace(1, 0, fade)
    s0 = int(ln['t'] * SR)
    s1 = min(N, s0 + len(a))
    vo[s0:s1] += a[: s1 - s0]
    spans.append((s0, s1))
    end = s1 / SR
    nxt = lines[i + 1]['t'] if i + 1 < len(lines) else N / SR
    flag = '  ⚠ déborde de %.1f s' % (end - nxt) if end > nxt - 0.15 else ''
    print(f"{ln['t']:6.1f} → {end:6.1f} s  {ln['text'][:70]}{flag}")

# Normalisation de la voix (crête à -3 dB) et ducking de la musique.
vo *= 0.7 / max(1e-6, np.abs(vo).max())
duck = np.ones(N)
pad_in, pad_out = int(0.25 * SR), int(0.6 * SR)
for s0, s1 in spans:
    duck[max(0, s0 - pad_in) : min(N, s1 + pad_out)] = args.duck
# Lissage du gain (constante de temps ~120 ms) pour des transitions douces.
k = int(0.12 * SR)
kernel = np.ones(k) / k
duck = np.convolve(duck, kernel, mode='same')
mix = music * duck[:, None] + np.stack([vo, vo], axis=1)
peak = np.abs(mix).max()
if peak > 0.98:
    mix *= 0.98 / peak
out = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open(args.out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print('→', args.out)
if args.timings:
    Path(args.timings).write_text(json.dumps({'lines': timings}, indent=1) + '\n')
    print('→', args.timings)
if args.voice_only:
    v = (np.clip(np.stack([vo, vo], axis=1), -1, 1) * 32767).astype(np.int16)
    with wave.open(args.voice_only, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(v.tobytes())
