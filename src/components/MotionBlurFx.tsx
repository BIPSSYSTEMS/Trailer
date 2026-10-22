import { BlendFunction, Effect, EffectAttribute } from 'postprocessing';
import React, { useMemo } from 'react';
import { Uniform, Vector2 } from 'three';

const fragment = /* glsl */ `
uniform vec2 uDir;
uniform float uZoom;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float amount = length(uDir) + abs(uZoom);
  if (amount < 0.0008) { outputColor = inputColor; return; }
  vec4 acc = vec4(0.0);
  const int N = 18;
  for (int i = 0; i < N; i++) {
    float t = float(i) / float(N - 1) - 0.5;
    vec2 off = uDir * t + (uv - 0.5) * uZoom * t;
    acc += texture2D(inputBuffer, clamp(uv - off, 0.001, 0.999));
  }
  outputColor = acc / float(N);
}
`;

class MotionBlurEffect extends Effect {
  constructor() {
    super('MotionBlurEffect', fragment, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['uDir', new Uniform(new Vector2())],
        ['uZoom', new Uniform(0)],
      ]),
    });
  }
}

/**
 * Flou de mouvement caméra en post-traitement : directionnel (whip pan) + radial (dolly).
 * Les vecteurs viennent de motionOf() : calculés depuis la caméra de la frame précédente, donc déterministes.
 */
export const MotionBlur: React.FC<{ dir: [number, number]; zoom: number }> = ({ dir, zoom }) => {
  const effect = useMemo(() => new MotionBlurEffect(), []);
  // Limite le flou pour éviter les traînées illisibles sur les coupes franches.
  const clampLen = 0.12;
  const len = Math.hypot(dir[0], dir[1]);
  const k = len > clampLen ? clampLen / len : 1;
  (effect.uniforms.get('uDir')!.value as Vector2).set(dir[0] * k, dir[1] * k);
  effect.uniforms.get('uZoom')!.value = Math.max(-0.25, Math.min(0.25, zoom));
  return <primitive object={effect} dispose={null} />;
};
