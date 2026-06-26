const G = 9.8;
const STEEPNESS = 0.45;
const TOTAL_WAVES = 8;

interface Wave {
  dir: [number, number];
  k: number;
  omega: number;
  amp: number;
  Qi: number;
  phase: number;
}

function makeWave(dir: [number, number], amp: number, phase: number, L: number): Wave {
  const k = (2 * Math.PI) / L;
  const omega = Math.sqrt(G * k);
  const n = TOTAL_WAVES;
  const Qi = STEEPNESS / (k * amp * n);
  const len = Math.sqrt(dir[0] ** 2 + dir[1] ** 2);
  return {
    dir: [dir[0] / len, dir[1] / len],
    k,
    omega,
    amp,
    Qi,
    phase,
  };
}

const WAVES: Wave[] = [
  makeWave([0.7, 0.7], 1.4, 0, 40),
  makeWave([0.26, 0.97], 0.9, 0.8, 25),
  makeWave([0.87, 0.5], 0.6, 1.5, 18),
  makeWave([-0.94, 0.34], 0.5, 2.2, 12),
  makeWave([0.34, -0.94], 0.3, 3.0, 8),
  makeWave([0.57, 0.82], 0.25, 0.3, 6),
  makeWave([-0.71, 0.71], 0.4, 1.8, 15),
  makeWave([0.77, -0.64], 0.35, 2.7, 10),
];

function arg(w: Wave, x: number, z: number, t: number): number {
  return w.k * (w.dir[0] * x + w.dir[1] * z) - w.omega * t + w.phase;
}

export function sampleOcean(x: number, z: number, t: number): { height: number; dispX: number; dispZ: number } {
  let h = 0, dx = 0, dz = 0;
  for (const w of WAVES) {
    const a = arg(w, x, z, t);
    h += w.amp * Math.sin(a);
    const c = w.Qi * w.amp * Math.cos(a);
    dx += c * w.dir[0];
    dz += c * w.dir[1];
  }
  return { height: h, dispX: dx, dispZ: dz };
}

export function sampleNormal(x: number, z: number, t: number): { x: number; y: number; z: number } {
  let dhdx = 0, dhdz = 0;
  for (const w of WAVES) {
    const a = arg(w, x, z, t);
    const c = w.amp * w.k * Math.cos(a);
    dhdx += c * w.dir[0];
    dhdz += c * w.dir[1];
  }
  const len = Math.sqrt(dhdx * dhdx + 1 + dhdz * dhdz);
  return { x: -dhdx / len, y: 1 / len, z: -dhdz / len };
}
