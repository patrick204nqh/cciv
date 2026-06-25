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
  Object.values(r).forEach(t => {
    if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(cfg.wrapS ?? 1, cfg.wrapT ?? 1); }
  });
  return r;
}

export function createCopperTexture() { return loadSet('copper'); }
export function createDeckTexture() { return loadSet('deck'); }
export function createSailTexture() { return loadSet('sail'); }
export function createMastTexture() { return loadSet('mast'); }
export function createHullTexture() { return loadSet('hull'); }
export function createIronTexture() { return loadSet('iron'); }
export function createPinnaceHullTexture() { return loadSet('pinnaceHull'); }
export function createPinnaceDeckTexture() { return loadSet('pinnaceDeck'); }
export function createPinnaceSailTexture() { return loadSet('pinnaceSail'); }

// Procedural fallbacks — kept for environments without downloaded textures
function mkTex(w: number, h: number, fn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  fn(c.getContext('2d')!, w, h);
  return new THREE.CanvasTexture(c);
}

export function createCopperTextureProcedural(): THREE.CanvasTexture {
  const tex = mkTex(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1a2e20'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 8 + Math.random() * 32;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const cols = ['#3a8a6e', '#4a9a7e', '#2a7a5e', '#5aaa88', '#1a6a50', '#6aba98'];
      const alpha = Math.random() > 0.5 ? 'cc' : 'dd';
      g.addColorStop(0, cols[Math.floor(Math.random() * 6)] + alpha);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath();
      ctx.ellipse(x, y, r * (0.4 + Math.random() * 0.8), r * 0.3, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 2 + Math.random() * 6;
      ctx.fillStyle = `rgba(180,120,60,${0.15 + Math.random() * 0.15})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(10,18,8,0.5)'; ctx.lineWidth = 0.8;
    for (let x = 0; x < w; x += 22) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 11) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(200,180,100,0.06)';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3.5, 1);
  return tex;
}

export function createDeckTextureProcedural(): THREE.CanvasTexture {
  const tex = mkTex(512, 512, (ctx, w, h) => {
    const pw = 30;
    for (let x = 0; x < w; x += pw) {
      const b = 0.78 + Math.random() * 0.28;
      ctx.fillStyle = `rgb(${~ ~(198 * b)},${~ ~(166 * b)},${~ ~(96 * b)})`;
      ctx.fillRect(x, 0, pw - 1, h);
      ctx.strokeStyle = 'rgba(90,55,20,.18)'; ctx.lineWidth = 0.6;
      for (let y = 2; y < h; y += 4 + Math.random() * 5) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + pw - 1, y + Math.random() * 3 - 1.5); ctx.stroke();
      }
      for (let k = 0; k < 3; k++) {
        const nx = x + pw * Math.random(), ny = 4 + Math.random() * (h - 8);
        ctx.fillStyle = 'rgba(40,25,10,0.35)';
        ctx.beginPath(); ctx.arc(nx, ny, 1.2 + Math.random() * 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(60,40,15,0.25)';
        ctx.beginPath(); ctx.arc(nx + 1, ny - 0.5, 0.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = '#1a1008';
    for (let x = pw - 1; x < w; x += pw) ctx.fillRect(x, 0, 1.8, h);
    ctx.strokeStyle = 'rgba(20,12,5,0.15)'; ctx.lineWidth = 0.4;
    for (let x = pw / 2; x < w; x += pw) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3.5, 9);
  return tex;
}

export function createSailTextureProcedural(): THREE.CanvasTexture {
  const tex = mkTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e8dfc4'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) {
      ctx.strokeStyle = `rgba(180,165,130,${0.04 + Math.random() * 0.04})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0, y + Math.random() * 0.5); ctx.lineTo(w, y + Math.random() * 0.5); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(170,155,120,0.12)';
    for (let i = 0; i < 120; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 0.5, Math.random() * 3);
    }
    ctx.fillStyle = 'rgba(100,85,60,0.08)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  tex.anisotropy = 4;
  return tex;
}
