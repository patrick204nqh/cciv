import { hexToRgb, createCanvas } from './utils';
import type { TexturePatternInput } from '../types';

export function deckPattern(input: TexturePatternInput): HTMLCanvasElement {
  const { width: w, height: h, color } = input;
  const [r, g, b] = hexToRgb(color);
  const [canvas, ctx] = createCanvas(w, h);
  const plankCount = 40;
  const plankH = h / plankCount;
  const gapH = 1;

  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    const varF = 1 + (Math.sin(i * 2.3 + 0.5) * 0.12);
    const vr = Math.min(1, r * varF);
    const vg = Math.min(1, g * varF);
    const vb = Math.min(1, b * varF);
    ctx.fillStyle = `rgb(${(vr * 255) | 0},${(vg * 255) | 0},${(vb * 255) | 0})`;
    ctx.fillRect(0, y, w, plankH - gapH);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  for (let i = 0; i < plankCount; i++) {
    ctx.fillRect(0, i * plankH + plankH - gapH, w, gapH);
  }

  return canvas;
}
