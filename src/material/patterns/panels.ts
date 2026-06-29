import { hexToCSS, createCanvas } from './utils';
import type { TexturePatternInput } from '../types';

export function panels(input: TexturePatternInput): HTMLCanvasElement {
  const { width: w, height: h, color } = input;
  const [canvas, ctx] = createCanvas(w, h);

  ctx.fillStyle = hexToCSS(color);
  ctx.fillRect(0, 0, w, h);

  const panelCount = 4;
  const panelW = w / panelCount;
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 2;
  for (let i = 1; i < panelCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * panelW, 0);
    ctx.lineTo(i * panelW, h);
    ctx.stroke();
  }

  return canvas;
}

export interface CompositePlanksInput extends TexturePatternInput {
  plankCount?: number;
  vertCount?: number;
}

export function compositePlanks(input: CompositePlanksInput): HTMLCanvasElement {
  const { width: w, height: h, color, plankCount: pc, vertCount: vc } = input;
  const [r, g, b] = [
    ((color >> 16) & 0xff) / 255,
    ((color >> 8) & 0xff) / 255,
    (color & 0xff) / 255,
  ];
  const [canvas, ctx] = createCanvas(w, h);
  const planks = pc ?? 20;
  const plankH = h / planks;
  const gapH = 1;

  for (let i = 0; i < planks; i++) {
    const y = i * plankH;
    const varF = 1 + (Math.sin(i * 1.3 + 2.1) * 0.06);
    const vr = Math.min(1, r * varF);
    const vg = Math.min(1, g * varF);
    const vb = Math.min(1, b * varF);
    ctx.fillStyle = `rgb(${(vr * 255) | 0},${(vg * 255) | 0},${(vb * 255) | 0})`;
    ctx.fillRect(0, y, w, plankH - gapH);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i < planks; i++) {
    ctx.fillRect(0, i * plankH + plankH - gapH, w, gapH);
  }

  const verts = vc ?? 6;
  const vertW = w / verts;
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  for (let i = 1; i < verts; i++) {
    ctx.beginPath();
    ctx.moveTo(i * vertW, 0);
    ctx.lineTo(i * vertW, h);
    ctx.stroke();
  }

  return canvas;
}
