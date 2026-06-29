import { hexToCSS, createCanvas } from './utils';
import type { TexturePatternInput } from '../types';

export function fabric(input: TexturePatternInput): HTMLCanvasElement {
  const { width: w, height: h, color } = input;
  const [canvas, ctx] = createCanvas(w, h);

  ctx.fillStyle = hexToCSS(color);
  ctx.fillRect(0, 0, w, h);

  const step = 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  return canvas;
}

export function fabricAlpha(input: TexturePatternInput): HTMLCanvasElement {
  const { width: w, height: h } = input;
  const [canvas, ctx] = createCanvas(w, h);
  const imageData = ctx.createImageData(w, h);
  const centerX = w / 2;
  const centerY = h / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY) * 0.55;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t = Math.max(0, Math.min(1, (dist - maxDist * 0.3) / (maxDist - maxDist * 0.3)));
      const noise = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.15 + Math.sin(x * 3 + y * 2) * 0.06;
      const alpha = Math.max(0, Math.min(1, 1 - t + noise));

      const idx = (y * w + x) * 4;
      imageData.data[idx] = 255;
      imageData.data[idx + 1] = 255;
      imageData.data[idx + 2] = 255;
      imageData.data[idx + 3] = alpha * 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
