import * as THREE from 'three';
import { TEXTURES, type TextureSet } from './sources';

const loader = new THREE.TextureLoader();

function loadTexture(path: string): THREE.Texture {
  const tex = loader.load(path);
  tex.anisotropy = 4;
  return tex;
}

interface LoadedTextureSet {
  map?: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  aoMap?: THREE.Texture;
  alphaMap?: THREE.Texture;
}

function loadSet(key: string): LoadedTextureSet {
  const cfg: TextureSet = (TEXTURES as any)[key];
  if (!cfg) return {};
  const r: LoadedTextureSet = {};
  if (cfg.diff) r.map = loadTexture(cfg.diff);
  if (cfg.nor_gl) r.normalMap = loadTexture(cfg.nor_gl);
  if (cfg.rough) r.roughnessMap = loadTexture(cfg.rough);
  if (cfg.metal) r.metalnessMap = loadTexture(cfg.metal);
  if (cfg.ao) r.aoMap = loadTexture(cfg.ao);
  if (cfg.alpha) r.alphaMap = loadTexture(cfg.alpha);
  Object.values(r).forEach(t => {
    if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(cfg.wrapS ?? 1, cfg.wrapT ?? 1); }
  });
  return r;
}

export function createCCIVHullTexture() { return loadSet('ccivHull'); }
export function createCCIVDeckTexture() { return loadSet('ccivDeck'); }
export function createCCIVSailTexture() { return loadSet('ccivSail'); }
export function createCCIVAftTexture() { return loadSet('ccivAft'); }
export function createCCIVRiggingTexture() { return loadSet('ccivRigging'); }
export function createCCIVDetailsTexture() { return loadSet('ccivDetails'); }
export function createCCIVInteriorTexture() { return loadSet('ccivInterior'); }
