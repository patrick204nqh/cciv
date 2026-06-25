import * as THREE from 'three';

const G = 9.8;

interface Wave {
  dir: [number, number];
  k: number;
  omega: number;
  amp: number;
  Qi: number;
  phase: number;
}

const WAVES: Wave[] = [
  { dir: [0.7, 0.7], k: 0, omega: 0, amp: 1.4, Qi: 0, phase: 0 },
  { dir: [0.26, 0.97], k: 0, omega: 0, amp: 0.9, Qi: 0, phase: 0.8 },
  { dir: [0.87, 0.5], k: 0, omega: 0, amp: 0.6, Qi: 0, phase: 1.5 },
  { dir: [-0.94, 0.34], k: 0, omega: 0, amp: 0.5, Qi: 0, phase: 2.2 },
  { dir: [0.34, -0.94], k: 0, omega: 0, amp: 0.3, Qi: 0, phase: 3.0 },
  { dir: [0.57, 0.82], k: 0, omega: 0, amp: 0.25, Qi: 0, phase: 0.3 },
  { dir: [-0.71, 0.71], k: 0, omega: 0, amp: 0.4, Qi: 0, phase: 1.8 },
  { dir: [0.77, -0.64], k: 0, omega: 0, amp: 0.35, Qi: 0, phase: 2.7 },
];

const WAVELENGTHS = [40, 25, 18, 12, 8, 6, 15, 10];
const STEEPNESS = 0.45;

function initWaves(): void {
  const n = WAVES.length;
  for (let i = 0; i < n; i++) {
    const w = WAVES[i];
    const L = WAVELENGTHS[i];
    w.k = (2 * Math.PI) / L;
    w.omega = Math.sqrt(G * w.k);
    w.Qi = STEEPNESS / (w.k * w.amp * n);
    const len = Math.sqrt(w.dir[0] ** 2 + w.dir[1] ** 2);
    w.dir[0] /= len;
    w.dir[1] /= len;
  }
}
initWaves();

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

export function sampleNormal(x: number, z: number, t: number): THREE.Vector3 {
  let dhdx = 0, dhdz = 0;
  for (const w of WAVES) {
    const a = arg(w, x, z, t);
    const c = w.amp * w.k * Math.cos(a);
    dhdx += c * w.dir[0];
    dhdz += c * w.dir[1];
  }
  return new THREE.Vector3(-dhdx, 1, -dhdz).normalize();
}
