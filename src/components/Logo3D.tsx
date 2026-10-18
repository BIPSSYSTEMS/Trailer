import React, { useMemo } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontJson from '../../public/fonts/inter-black.typeface.json';
import { useTexture } from '../lib/textures';
import { MATCAPS } from '../lib/materials';

const font = new FontLoader().parse(fontJson as never);

/** Matcap or + bande de reflet qui balaie la face (uSweep de -1 à 2 = passage complet). */
const sheenMaterial = (matcap: THREE.Texture) =>
  new THREE.ShaderMaterial({
    uniforms: { uMatcap: { value: matcap }, uSweep: { value: -1 }, uBoost: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vView;
      varying vec2 vP;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        vP = position.xy;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMatcap;
      uniform float uSweep;
      uniform float uBoost;
      varying vec3 vN;
      varying vec3 vView;
      varying vec2 vP;
      void main() {
        vec3 x = normalize(vec3(vView.z, 0.0, -vView.x));
        vec3 y = cross(vView, x);
        vec2 uv = vec2(dot(x, vN), dot(y, vN)) * 0.495 + 0.5;
        vec3 col = texture2D(uMatcap, uv).rgb * uBoost;
        float d = (vP.x * 0.18 + vP.y * 0.12) - uSweep;
        float band = exp(-d * d * 220.0) * 1.6 + exp(-d * d * 18.0) * 0.25;
        col += vec3(1.0, 0.95, 0.8) * band;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

/** Mot extrudé en or (logo BIPS), centré sur son origine. */
export const Logo3D: React.FC<{
  word?: string;
  size?: number;
  depth?: number;
  sweep?: number;
  boost?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ word = 'BIPS', size = 1.2, depth = 0.4, sweep = -1, boost = 1, position, rotation, scale = 1 }) => {
  const gold = useTexture(MATCAPS.gold);
  const satin = useTexture(MATCAPS.goldSatin);
  const geo = useMemo(() => {
    const g = new TextGeometry(word, {
      font,
      size,
      depth,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: size * 0.05,
      bevelSize: size * 0.035,
      bevelSegments: 4,
    });
    g.computeBoundingBox();
    const b = g.boundingBox!;
    g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
    return g;
  }, [word, size, depth]);
  const face = useMemo(() => (gold ? sheenMaterial(gold) : null), [gold]);
  const side = useMemo(() => (satin ? new THREE.MeshMatcapMaterial({ matcap: satin, color: '#c8902a' }) : null), [satin]);
  if (!face || !side) return null;
  face.uniforms.uSweep.value = sweep;
  face.uniforms.uBoost.value = boost;
  return <mesh geometry={geo} material={[face, side]} position={position} rotation={rotation} scale={scale} />;
};
