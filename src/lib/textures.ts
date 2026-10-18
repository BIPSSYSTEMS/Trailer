import React, { useEffect, useMemo, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import * as THREE from 'three';

const cache = new Map<string, Promise<THREE.Texture>>();
const loaded = new Map<string, THREE.Texture>();

const load = (path: string) => {
  let p = cache.get(path);
  if (!p) {
    p = new THREE.TextureLoader().loadAsync(staticFile(path)).then((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      loaded.set(path, t);
      return t;
    });
    cache.set(path, p);
  }
  return p;
};

/**
 * Ne monte ses enfants qu'une fois toutes les textures chargées (la frame attend via delayRender).
 * La scène 3D se crée donc avec ses textures déjà prêtes : rien à redessiner après coup.
 */
export const TextureGate: React.FC<{ paths: readonly string[]; children: React.ReactNode }> = ({ paths, children }) => {
  const key = paths.join('|');
  const [, setTick] = useState(0);
  const ready = paths.every((p) => loaded.has(p));
  const handle = useMemo(() => (ready ? null : delayRender(`textures (${paths.length})`)), [key]);
  useEffect(() => {
    if (handle === null) return;
    let alive = true;
    Promise.all(paths.map(load)).then(() => {
      if (alive) setTick((t) => t + 1);
      continueRender(handle);
    });
    return () => {
      alive = false;
    };
  }, [handle]);
  return ready ? React.createElement(React.Fragment, null, children) : null;
};

/** Texture déjà chargée par un TextureGate parent (null sinon). */
export const useTexture = (path: string): THREE.Texture | null => {
  const t = loaded.get(path) ?? null;
  if (!t) load(path);
  return t;
};
