import type { ModelConfig } from '../../types';

export interface GroupTextureConfig {
  color: number;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  alphaTest?: number;
}

export interface GeneratedTextures {
  map?: HTMLCanvasElement;
  alphaMap?: HTMLCanvasElement;
  roughnessMap?: HTMLCanvasElement;
  metalnessMap?: HTMLCanvasElement;
}

function hexToCSS(hex: number): string {
  return `#${((hex >> 16) & 0xff).toString(16).padStart(2, '0')}${((hex >> 8) & 0xff).toString(16).padStart(2, '0')}${(hex & 0xff).toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex: number): [number, number, number] {
  return [((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255];
}

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return [canvas, { clearRect() {}, fillRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, putImageData() {}, createImageData: (_w: number, _h: number) => { return { data: new Uint8ClampedArray(_w * _h * 4) }; }, get canvas() { return canvas; }, fillStyle: '', strokeStyle: '', lineWidth: 1 } as unknown as CanvasRenderingContext2D];
  }
  return [canvas, ctx];
}

function fillPlanks(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number, baseHex: number, plankCount: number, gapRatio: number): void {
  const [r, g, b] = hexToRgb(baseHex);
  const plankH = h / plankCount;
  const gapH = plankH * gapRatio;

  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    const varF = 1 + (Math.sin(i * 1.7 + i * 0.3) * 0.08);
    const vr = Math.min(1, r * varF);
    const vg = Math.min(1, g * varF);
    const vb = Math.min(1, b * varF);
    ctx.fillStyle = `rgb(${vr * 255 | 0},${vg * 255 | 0},${vb * 255 | 0})`;
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
}

function fillDeck(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number, baseHex: number): void {
  const [r, g, b] = hexToRgb(baseHex);
  const plankCount = 40;
  const plankH = h / plankCount;
  const gapH = 1;

  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    const varF = 1 + (Math.sin(i * 2.3 + 0.5) * 0.12);
    const vr = Math.min(1, r * varF);
    const vg = Math.min(1, g * varF);
    const vb = Math.min(1, b * varF);
    ctx.fillStyle = `rgb(${vr * 255 | 0},${vg * 255 | 0},${vb * 255 | 0})`;
    ctx.fillRect(0, y, w, plankH - gapH);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  for (let i = 0; i < plankCount; i++) {
    ctx.fillRect(0, i * plankH + plankH - gapH, w, gapH);
  }
}

function fillSails(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number, baseHex: number): void {
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = hexToCSS(baseHex);
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
}

function fillSailAlpha(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number): void {
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
}

function fillRigging(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number, baseHex: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = hexToCSS(baseHex);
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
}

function fillDetails(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number, baseHex: number, metalness?: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = hexToCSS(baseHex);
  ctx.fillRect(0, 0, w, h);

  if (metalness && metalness > 0) {
    const count = 40 + (metalness * 60);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = 1 + Math.random() * 3;
      const bright = 0.6 + Math.random() * 0.4;
      ctx.fillStyle = `rgba(${bright * 255 | 0},${bright * 255 | 0},${bright * 255 | 0},0.3)`;
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
}

function fillInterior(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number, baseHex: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = hexToCSS(baseHex);
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
}

function fillAft(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number, baseHex: number): void {
  const [r, g, b] = hexToRgb(baseHex);
  const plankCount = 20;
  const plankH = h / plankCount;
  const gapH = 1;

  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    const varF = 1 + (Math.sin(i * 1.3 + 2.1) * 0.06);
    const vr = Math.min(1, r * varF);
    const vg = Math.min(1, g * varF);
    const vb = Math.min(1, b * varF);
    ctx.fillStyle = `rgb(${vr * 255 | 0},${vg * 255 | 0},${vb * 255 | 0})`;
    ctx.fillRect(0, y, w, plankH - gapH);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i < plankCount; i++) {
    ctx.fillRect(0, i * plankH + plankH - gapH, w, gapH);
  }

  const vertCount = 6;
  const vertW = w / vertCount;
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  for (let i = 1; i < vertCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * vertW, 0);
    ctx.lineTo(i * vertW, h);
    ctx.stroke();
  }
}

export function generateGroupTextures(groupName: string, config: GroupTextureConfig, width = 512, height = 512): GeneratedTextures {
  const w = width;
  const h = height;
  const result: GeneratedTextures = {};

  switch (groupName) {
    case 'hull': {
      const [canvas, ctx] = createCanvas(w, h);
      fillPlanks(canvas, ctx, w, h, config.color, 14, 0.06);
      result.map = canvas;
      break;
    }
    case 'deck': {
      const [canvas, ctx] = createCanvas(w, h);
      fillDeck(canvas, ctx, w, h, config.color);
      result.map = canvas;
      break;
    }
    case 'sails': {
      const [canvas, ctx] = createCanvas(w, h);
      fillSails(canvas, ctx, w, h, config.color);
      result.map = canvas;

      const [alphaCanvas, alphaCtx] = createCanvas(w, h);
      fillSailAlpha(alphaCanvas, alphaCtx, w, h);
      result.alphaMap = alphaCanvas;
      break;
    }
    case 'rigging': {
      const [canvas, ctx] = createCanvas(w, h);
      fillRigging(canvas, ctx, w, h, config.color);
      result.map = canvas;
      break;
    }
    case 'details': {
      const [canvas, ctx] = createCanvas(w, h);
      fillDetails(canvas, ctx, w, h, config.color, config.metalness);
      result.map = canvas;
      break;
    }
    case 'interior': {
      const [canvas, ctx] = createCanvas(w, h);
      fillInterior(canvas, ctx, w, h, config.color);
      result.map = canvas;
      break;
    }
    case 'aft': {
      const [canvas, ctx] = createCanvas(w, h);
      fillAft(canvas, ctx, w, h, config.color);
      result.map = canvas;
      break;
    }
  }

  return result;
}

export function generateShipTextures(config: ModelConfig): Record<string, GeneratedTextures> {
  const overrides = config.materialOverrides ?? {} as Record<string, GroupTextureConfig>;
  const result: Record<string, GeneratedTextures> = {};

  for (const [groupName, groupConfig] of Object.entries(overrides)) {
    result[groupName] = generateGroupTextures(groupName, groupConfig);
  }

  return result;
}
