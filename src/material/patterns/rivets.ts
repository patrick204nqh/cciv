import { hexToCSS, createCanvas } from './utils';
import type { TexturePatternInput } from '../types';

export interface RivetsInput extends TexturePatternInput {
  metalness?: number;
}

export function rivets(input: RivetsInput): HTMLCanvasElement {
  const { width: w, height: h, color, metalness } = input;
  const [canvas, ctx] = createCanvas(w, h);

  ctx.fillStyle = hexToCSS(color);
  ctx.fillRect(0, 0, w, h);

  if (metalness && metalness > 0) {
    const count = 40 + metalness * 60;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = 1 + Math.random() * 3;
      const bright = 0.6 + Math.random() * 0.4;
      ctx.fillStyle = `rgba(${(bright * 255) | 0},${(bright * 255) | 0},${(bright * 255) | 0},0.3)`;
      ctx.fillRect(x, y, size, size);
    }
  }

  const rivetCount = 8;
  const rivetSpacing = w / rivetCount;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  for (let i = 0; i < rivetCount; i++) {
    ctx.beginPath();
    ctx.arc(i * rivetSpacing + rivetSpacing / 2, h * 0.15, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(i * rivetSpacing + rivetSpacing / 2, h * 0.85, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}
