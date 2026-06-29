import { hexToRgb, createCanvas } from './utils';
import type { TexturePatternInput } from '../types';

export function planks(input: TexturePatternInput): HTMLCanvasElement {
  const { width: w, height: h, color } = input;
  const [r, g, b] = hexToRgb(color);
  const [canvas, ctx] = createCanvas(w, h);
  const plankCount = 14;
  const plankH = h / plankCount;
  const gapRatio = 0.06;
  const gapH = plankH * gapRatio;

  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    const varF = 1 + (Math.sin(i * 1.7 + i * 0.3) * 0.08);
    const vr = Math.min(1, r * varF);
    const vg = Math.min(1, g * varF);
    const vb = Math.min(1, b * varF);
    ctx.fillStyle = `rgb(${(vr * 255) | 0},${(vg * 255) | 0},${(vb * 255) | 0})`;
    ctx.fillRect(0, y, w, plankH - gapH);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let i = 0; i < plankCount; i++) {
    ctx.fillRect(0, i * plankH + plankH - gapH, w, gapH);
  }

  const nailStep = w / 6;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH + plankH * 0.25;
    for (let x = nailStep; x < w - nailStep / 2; x += nailStep) {
      ctx.beginPath();
      ctx.arc(x + (i % 2) * 3, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas;
}
