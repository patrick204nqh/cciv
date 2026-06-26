import * as THREE from 'three';
import { TEXTURES, type TextureSet } from './sources';

const loader = new THREE.TextureLoader();

function loadTexture(path: string): THREE.Texture {
  const tex = loader.load(path);
  tex.anisotropy = 4;
  return tex;
}

export interface LoadedTextureSet {
  map?: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  aoMap?: THREE.Texture;
  alphaMap?: THREE.Texture;
}

export function loadTextureSet(key: string): LoadedTextureSet {
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

export function createCCIVHullTexture() { return loadTextureSet('ccivHull'); }
export function createCCIVDeckTexture() { return loadSet('ccivDeck'); }
export function createCCIVSailTexture() { return loadSet('ccivSail'); }
export function createCCIVAftTexture() { return loadSet('ccivAft'); }
export function createCCIVRiggingTexture() { return loadSet('ccivRigging'); }
export function createCCIVDetailsTexture() { return loadSet('ccivDetails'); }
export function createCCIVInteriorTexture() { return loadSet('ccivInterior'); }

function canvas(w: number, h: number, fn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  fn(c.getContext('2d')!);
  return c;
}

function hash2D(x: number, y: number): number {
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2D(ix, iy), b = hash2D(ix + 1, iy);
  const c = hash2D(ix, iy + 1), d = hash2D(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(x: number, y: number, octaves: number): number {
  let v = 0, amp = 1, freq = 1;
  for (let i = 0; i < octaves; i++) {
    v += amp * smoothNoise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2;
  }
  return v;
}

export function createWaterNormalMap(): THREE.CanvasTexture {
  const w = 512, h = 512;
  const imgData = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w * 8, v = y / h * 8;
      const eps = 0.01;
      const h0 = fbm(u, v, 4);
      const hx = fbm(u + eps, v, 4);
      const hy = fbm(u, v + eps, 4);
      const dx = (hx - h0) / eps;
      const dy = (hy - h0) / eps;
      const nl = Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * w + x) * 4;
      imgData[i] = (dx / nl * 0.5 + 0.5) * 255;
      imgData[i + 1] = (dy / nl * 0.5 + 0.5) * 255;
      imgData[i + 2] = (1 / nl) * 255;
      imgData[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(imgData, w, h, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function createWaterDiffuseMap(): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas(256, 256, ctx => {
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const u = x / 256 * 6, v = y / 256 * 6;
        const h = fbm(u, v, 3);
        const r = 30 + h * 20;
        const g = 100 + h * 40;
        const b = 160 + h * 30;
        ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = 4;
  return tex;
}
