import { hexToCSS, createCanvas } from './utils';
import type { TexturePatternInput } from '../types';

export function rope(input: TexturePatternInput): HTMLCanvasElement {
  const { width: w, height: h, color } = input;
  const [canvas, ctx] = createCanvas(w, h);

  ctx.fillStyle = hexToCSS(color);
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 2;
  const spacing = 16;
  for (let offset = 0; offset < w + h; offset += spacing) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset - h, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + h, h);
    ctx.stroke();
  }

  return canvas;
}
