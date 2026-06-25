import * as THREE from 'three';
import { createCopperTexture, createDeckTexture, createSailTexture } from '../textures';

const copperTex = createCopperTexture();
const deckTex = createDeckTexture();
const sailTex = createSailTexture();

export const M = {
  copper: new THREE.MeshStandardMaterial({ map: copperTex, color: 0x7aaa88, roughness: 0.78, metalness: 0.42 }),
  hull: new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.93, metalness: 0.03 }),
  gun: new THREE.MeshStandardMaterial({ color: 0xcec07a, roughness: 0.72, metalness: 0.05 }),
  deck: new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.88, metalness: 0 }),
  mast: new THREE.MeshStandardMaterial({ color: 0xb89248, roughness: 0.88, metalness: 0.04 }),
  sail: new THREE.MeshStandardMaterial({ map: sailTex, color: 0xe8dfc4, roughness: 1, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
  rl: new THREE.LineBasicMaterial({ color: 0x201c14 }),
  rll: new THREE.LineBasicMaterial({ color: 0x9a8050 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xb07828, roughness: 0.28, metalness: 0.9 }),
  wdark: new THREE.MeshStandardMaterial({ color: 0x2e1c0c, roughness: 0.96, metalness: 0 }),
  wlight: new THREE.MeshStandardMaterial({ color: 0x7e5828, roughness: 0.9, metalness: 0 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x383838, roughness: 0.62, metalness: 0.72 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x80a8bc, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.48 }),
  water: new THREE.MeshStandardMaterial({ color: 0x0a3050, roughness: 0.08, metalness: 0.08, transparent: true, opacity: 0.82 }),
} as const;
