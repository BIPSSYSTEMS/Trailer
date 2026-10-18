import { Line } from '@react-three/drei';
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '../lib/textures';
import { C } from '../theme';

type V3 = [number, number, number];
export const LAND = 'textures/land-mask.png';

/** Points dorés sur les terres émergées (masque équirectangulaire) : sert à la carte plate et au globe. */
const dotsMaterial = (land: THREE.Texture, dots: number, color: string, ocean: string, oceanAlpha: number) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uLand: { value: land },
      uDots: { value: dots },
      uColor: { value: new THREE.Color(color) },
      uOcean: { value: new THREE.Color(ocean) },
      uOceanAlpha: { value: oceanAlpha },
      uOpacity: { value: 1 },
      uRim: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uLand;
      uniform float uDots;
      uniform vec3 uColor;
      uniform vec3 uOcean;
      uniform float uOceanAlpha;
      uniform float uOpacity;
      uniform float uRim;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec2 grid = vec2(uDots, uDots * 0.5);
        vec2 g = vUv * grid;
        vec2 c = fract(g) - 0.5;
        float land = texture2D(uLand, (floor(g) + 0.5) / grid).r;
        float d = smoothstep(0.34, 0.2, length(c)) * step(0.5, land);
        float rim = pow(1.0 - max(dot(vN, vV), 0.0), 3.0) * uRim;
        vec3 col = mix(uOcean, uColor * 0.95, d) + vec3(0.35, 0.55, 1.0) * rim;
        float a = max(d, uOceanAlpha) + rim;
        gl_FragColor = vec4(col, a * uOpacity);
      }
    `,
  });

export const lonLatToMap = (lon: number, lat: number, w = 16): V3 => [(lon / 180) * (w / 2), 0, (-lat / 90) * (w / 4)];
export const lonLatToSphere = (lon: number, lat: number, r: number): V3 => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return [-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)];
};

export const HUBS = {
  ny: [-74, 40.7],
  london: [-0.1, 51.5],
  frankfurt: [8.7, 50.1],
  gulf: [52, 25.5],
  shanghai: [121.5, 31.2],
  tokyo: [139.7, 35.7],
  saopaulo: [-46.6, -23.5],
  singapore: [103.8, 1.3],
} as const;
export type Hub = keyof typeof HUBS;

export const FlatMap: React.FC<{ width?: number; opacity?: number }> = ({ width = 16, opacity = 1 }) => {
  const land = useTexture(LAND);
  const mat = useMemo(() => (land ? dotsMaterial(land, 200, C.gold, '#0b1838', 0.0) : null), [land]);
  if (!mat) return null;
  mat.uniforms.uOpacity.value = opacity;
  return (
    <mesh rotation-x={-Math.PI / 2} material={mat}>
      <planeGeometry args={[width, width / 2]} />
    </mesh>
  );
};

export const Globe: React.FC<{ radius?: number; rotY?: number; children?: React.ReactNode }> = ({ radius = 2, rotY = 0, children }) => {
  const land = useTexture(LAND);
  const mat = useMemo(() => (land ? dotsMaterial(land, 200, C.gold, '#0a1636', 0.92) : null), [land]);
  if (!mat) return null;
  mat.uniforms.uRim.value = 1.2;
  return (
    <group rotation-y={rotY}>
      <mesh material={mat}>
        <sphereGeometry args={[radius, 96, 64]} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[radius, 48, 32]} />
        <meshBasicMaterial color="#3d6bff" transparent opacity={0.08} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {children}
    </group>
  );
};

/** Arc lumineux entre deux points, dessiné jusqu'à `p` (0 → 1), avec une impulsion qui voyage dessus. */
export const Arc: React.FC<{ a: V3; b: V3; lift: number; p: number; pulse?: number; color?: string; sphere?: number }> = ({
  a,
  b,
  lift,
  p,
  pulse,
  color = C.goldHot,
  sphere,
}) => {
  const pts = useMemo(() => {
    const out: V3[] = [];
    const n = 64;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const v = new THREE.Vector3().lerpVectors(new THREE.Vector3(...a), new THREE.Vector3(...b), t);
      const h = Math.sin(Math.PI * t) * lift;
      if (sphere) v.setLength(sphere + h);
      else v.y += h;
      out.push([v.x, v.y, v.z]);
    }
    return out;
  }, [a, b, lift, sphere]);
  const k = Math.max(2, Math.round(p * (pts.length - 1)) + 1);
  if (p <= 0) return null;
  const head = pts[k - 1];
  const pi = pulse === undefined ? -1 : Math.round(((pulse % 1) + 1) % 1 * (pts.length - 1));
  return (
    <>
      <Line points={pts.slice(0, k)} color={color} lineWidth={5} toneMapped={false} transparent opacity={0.95} />
      <mesh position={head}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      {pi >= 0 && pi < k && (
        <mesh position={pts[pi]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color={C.green} toneMapped={false} />
        </mesh>
      )}
    </>
  );
};

export const hubMap = (h: Hub) => lonLatToMap(HUBS[h][0], HUBS[h][1]);
export const hubSphere = (h: Hub, r: number) => lonLatToSphere(HUBS[h][0], HUBS[h][1], r);
