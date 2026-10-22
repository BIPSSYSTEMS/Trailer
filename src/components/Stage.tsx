import { useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing';
import { ThreeCanvas } from '@remotion/three';
import { BlendFunction } from 'postprocessing';
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { motionOf } from '../lib/camera';
import { MATCAPS } from '../lib/materials';
import { TextureGate } from '../lib/textures';
import { C } from '../theme';
import { MotionBlur } from './MotionBlurFx';

export type Cam = {
  pos: [number, number, number];
  target: [number, number, number];
  /** Champ vertical en degrés, pensé pour le 9:16. Converti automatiquement en 16:9. */
  fov?: number;
  roll?: number;
};

/**
 * Règle d'adaptation des formats : en 16:9, le champ vertical vaut 80 % de celui du 9:16.
 * On garde l'essentiel de la hauteur utile (personnages, logo) et on gagne beaucoup de largeur.
 */
export const vfovFor = (fovPortrait: number, aspect: number) => (aspect <= 1 ? fovPortrait : fovPortrait * 0.8);

const CameraRig: React.FC<Cam> = ({ pos, target, fov = 40, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    const aspect = size.width / size.height;
    camera.position.set(...pos);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(...target);
    camera.fov = vfovFor(fov, aspect);
    camera.aspect = aspect;
    camera.near = 0.05;
    camera.far = 400;
    camera.updateProjectionMatrix();
  });
  return null;
};

/**
 * Le compositeur de post-traitement a besoin de quelques passes pour s'initialiser : sans ça, les premières
 * images rendues par un onglet sortent noires. On retient la première frame le temps de 4 rendus.
 */
const Warmup: React.FC = () => {
  const advance = useThree((s) => s.advance);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const handle = delayRender('warmup post-processing');
    let n = 0;
    const tick = () => {
      advance(performance.now());
      if (++n < 4) requestAnimationFrame(tick);
      else continueRender(handle);
    };
    requestAnimationFrame(tick);
  }, [advance]);
  return null;
};

export type StageProps = {
  /** Caméra en fonction de la frame de la scène (sert aussi au calcul du flou de mouvement). */
  cam: (f: number) => Cam;
  children: React.ReactNode;
  bloom?: number;
  bloomThreshold?: number;
  aberration?: number;
  vignette?: number;
  fog?: [number, number];
  background?: string;
  motionBlur?: number;
  /** Textures (chemins sous public/) à charger avant de monter la scène. */
  textures?: readonly string[];
  exposure?: number;
};

/** Toile 3D commune : fond bleu nuit, brouillard, bloom, aberration chromatique, vignette, flou de mouvement. */
export const Stage: React.FC<StageProps> = ({
  cam,
  children,
  bloom = 1,
  bloomThreshold = 0.62,
  aberration = 0.0012,
  vignette = 0.55,
  fog = [12, 60],
  background = C.bg,
  motionBlur = 1,
  textures = [],
  exposure = 1.05,
}) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const c = cam(frame);
  const aspect = width / height;
  const m = motionOf((f) => ({ ...cam(f), fov: vfovFor(cam(f).fov ?? 40, aspect) }), frame, aspect);
  const all = useMemo(() => [...Object.values(MATCAPS), ...textures], [textures]);
  return (
    <TextureGate paths={all}>
      <ThreeCanvas
        width={width}
        height={height}
        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        dpr={1}
        camera={{ fov: c.fov ?? 40, position: c.pos }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = exposure;
        }}
      >
        <color attach="background" args={[background]} />
        <fog attach="fog" args={[background, fog[0], fog[1]]} />
        <CameraRig {...c} />
        <ambientLight intensity={0.35} color="#8fa6ff" />
        <directionalLight position={[4, 8, 6]} intensity={2.2} color="#fff1d0" />
        <directionalLight position={[-6, 3, -4]} intensity={1.2} color="#5b7cff" />
        {children}
        <EffectComposer multisampling={0} enableNormalPass={false} frameBufferType={THREE.UnsignedByteType}>
          <MotionBlur dir={[m.dir[0] * motionBlur, m.dir[1] * motionBlur]} zoom={m.zoom * motionBlur} />
          <Bloom intensity={bloom} luminanceThreshold={bloomThreshold} luminanceSmoothing={0.2} mipmapBlur radius={0.75} />
          <ChromaticAberration
            offset={new THREE.Vector2(aberration, aberration * 0.6)}
            radialModulation
            modulationOffset={0.35}
            blendFunction={BlendFunction.NORMAL}
          />
          <Vignette eskil={false} offset={0.25} darkness={vignette} />
        </EffectComposer>
        <Warmup />
      </ThreeCanvas>
    </TextureGate>
  );
};
