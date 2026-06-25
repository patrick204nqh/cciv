import * as THREE from 'three';
import {
  createCopperTexture, createDeckTexture, createSailTexture,
  createMastTexture, createHullTexture, createIronTexture,
  createPinnaceHullTexture, createPinnaceDeckTexture,
  createPinnaceSailTexture,
} from '../textures';

const copper = createCopperTexture();
const deck = createDeckTexture();
const sail = createSailTexture();
const mast = createMastTexture();
const hullTex = createHullTexture();
const ironTex = createIronTexture();

const pHull = createPinnaceHullTexture();
const pDeck = createPinnaceDeckTexture();
const pSail = createPinnaceSailTexture();

export const M = {
  copper: new THREE.MeshStandardMaterial({
    map: copper.map, normalMap: copper.normalMap,
    roughnessMap: copper.roughnessMap, metalnessMap: copper.metalnessMap,
    color: 0x7aaa88, roughness: 0.78, metalness: 0.42,
  }),
  hull: new THREE.MeshStandardMaterial({
    map: pHull.map, normalMap: pHull.normalMap,
    roughnessMap: pHull.roughnessMap,
    color: 0x1c160e, roughness: 0.92, metalness: 0.02,
  }),
  gun: new THREE.MeshStandardMaterial({ color: 0xcec07a, roughness: 0.72, metalness: 0.05 }),
  deck: new THREE.MeshStandardMaterial({
    map: pDeck.map, normalMap: pDeck.normalMap,
    roughnessMap: pDeck.roughnessMap,
    color: 0x887050, roughness: 0.88, metalness: 0,
  }),
  mast: new THREE.MeshStandardMaterial({
    map: mast.map, normalMap: mast.normalMap,
    roughnessMap: mast.roughnessMap,
    color: 0xb89248, roughness: 0.88, metalness: 0.04,
  }),
  sail: new THREE.MeshStandardMaterial({
    map: pSail.map, normalMap: pSail.normalMap,
    roughnessMap: pSail.roughnessMap,
    color: 0xf5edd9, roughness: 1, metalness: 0,
    side: THREE.DoubleSide, transparent: true, opacity: 0.85,
  }),
  rl: new THREE.LineBasicMaterial({ color: 0x201c14 }),
  rll: new THREE.LineBasicMaterial({ color: 0x9a8050 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xb07828, roughness: 0.28, metalness: 0.9 }),
  wdark: new THREE.MeshStandardMaterial({ color: 0x2e1c0c, roughness: 0.96, metalness: 0 }),
  wlight: new THREE.MeshStandardMaterial({ color: 0x7e5828, roughness: 0.9, metalness: 0 }),
  iron: new THREE.MeshStandardMaterial({
    map: ironTex.map, normalMap: ironTex.normalMap,
    roughnessMap: ironTex.roughnessMap, metalnessMap: ironTex.metalnessMap,
    color: 0x383838, roughness: 0.62, metalness: 0.72,
  }),
  glass: new THREE.MeshStandardMaterial({ color: 0x80a8bc, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.48 }),
  water: new THREE.MeshStandardMaterial({ color: 0x0a3050, roughness: 0.08, metalness: 0.08, transparent: true, opacity: 0.82 }),
} as const;
