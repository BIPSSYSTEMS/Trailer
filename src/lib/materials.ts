import * as THREE from 'three';
import { useTexture } from './textures';

export const MATCAPS = {
  gold: 'textures/matcap-gold.png',
  goldSatin: 'textures/matcap-gold-satin.png',
  chrome: 'textures/matcap-chrome.png',
  obsidian: 'textures/matcap-obsidian.png',
} as const;
export type MatcapName = keyof typeof MATCAPS;

const mats = new Map<string, THREE.MeshMatcapMaterial>();

/** Matériau matcap partagé (or, chrome…), teinte optionnelle. Les textures sont préchargées par <Stage>. */
export const useMatcap = (name: MatcapName, color = '#ffffff') => {
  const tex = useTexture(MATCAPS[name]);
  const key = `${name}|${color}`;
  let m = mats.get(key);
  if (!m && tex) {
    m = new THREE.MeshMatcapMaterial({ matcap: tex, color });
    mats.set(key, m);
  }
  return m ?? null;
};
