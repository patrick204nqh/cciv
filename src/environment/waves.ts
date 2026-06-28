import type { ComputedWave } from './wave-config';

export type { ComputedWave } from './wave-config';
export { computeWaves } from './wave-config';

export function sampleOcean(
  x: number, z: number, t: number, waves: ComputedWave[],
): { height: number; dispX: number; dispZ: number } {
  let h = 0, dx = 0, dz = 0;
  for (const w of waves) {
    const a = arg(w, x, z, t);
    h += w.amp * Math.sin(a);
    const c = w.Qi * w.amp * Math.cos(a);
    dx += c * w.dir[0];
    dz += c * w.dir[1];
  }
  return { height: h, dispX: dx, dispZ: dz };
}

export function sampleNormal(
  x: number, z: number, t: number, waves: ComputedWave[],
): { x: number; y: number; z: number } {
  let dhdx = 0, dhdz = 0;
  for (const w of waves) {
    const a = arg(w, x, z, t);
    const c = w.amp * w.k * Math.cos(a);
    dhdx += c * w.dir[0];
    dhdz += c * w.dir[1];
  }
  const len = Math.sqrt(dhdx * dhdx + 1 + dhdz * dhdz);
  return { x: -dhdx / len, y: 1 / len, z: -dhdz / len };
}

function arg(w: ComputedWave, x: number, z: number, t: number): number {
  return w.k * (w.dir[0] * x + w.dir[1] * z) - w.omega * t + w.phase;
}
