import * as THREE from 'three';

function mkTex(w: number, h: number, fn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  fn(c.getContext('2d')!, w, h);
  return new THREE.CanvasTexture(c);
}

export function createCopperTexture(): THREE.CanvasTexture {
  const tex = mkTex(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2e3d22'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 6 + Math.random() * 28;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const cols = ['#1e6050cc', '#288060cc', '#1a7055cc', '#3a6040aa', '#2a5545aa'];
      g.addColorStop(0, cols[Math.floor(Math.random() * 5)]); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath();
      ctx.ellipse(x, y, r * (0.4 + Math.random() * 0.8), r * 0.25, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(15,22,12,.45)'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 22) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 11) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3.5, 1);
  return tex;
}

export function createDeckTexture(): THREE.CanvasTexture {
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
    }
    ctx.fillStyle = '#2a2015';
    for (let x = pw - 1; x < w; x += pw) ctx.fillRect(x, 0, 1.5, h);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3.5, 9);
  return tex;
}
