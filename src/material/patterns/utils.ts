export function hexToCSS(hex: number): string {
  const r = ((hex >> 16) & 0xff).toString(16).padStart(2, '0');
  const g = ((hex >> 8) & 0xff).toString(16).padStart(2, '0');
  const b = (hex & 0xff).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function hexToRgb(hex: number): [number, number, number] {
  return [((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255];
}

export function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return [canvas, {
      clearRect() {},
      fillRect() {},
      beginPath() {},
      arc() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      fill() {},
      putImageData() {},
      createImageData: (_w: number, _h: number) => ({ data: new Uint8ClampedArray(_w * _h * 4) }),
      get canvas() { return canvas; },
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    } as unknown as CanvasRenderingContext2D];
  }
  return [canvas, ctx];
}
