import { MeshPhysicalNodeMaterial, TSL } from 'three/webgpu';
const {
  Fn, vec3, float, sin, cos, time, positionLocal, normalize,
} = TSL;

const G = 9.8;
const STEEPNESS = 0.45;
const TOTAL_WAVES = 8;
const WAVE_SPEED = 0.42;

interface WaveData {
  dir: [number, number];
  k: number;
  omega: number;
  amp: number;
  Qi: number;
  phase: number;
}

function makeWave(dir: [number, number], amp: number, phase: number, L: number): WaveData {
  const k = (2 * Math.PI) / L;
  const omega = Math.sqrt(G * k);
  const Qi = STEEPNESS / (k * amp * TOTAL_WAVES);
  const len = Math.sqrt(dir[0] ** 2 + dir[1] ** 2);
  return {
    dir: [dir[0] / len, dir[1] / len],
    k, omega, amp, Qi, phase,
  };
}

const WAVES: WaveData[] = [
  makeWave([0.7, 0.7], 1.4, 0, 40),
  makeWave([0.26, 0.97], 0.9, 0.8, 25),
  makeWave([0.87, 0.5], 0.6, 1.5, 18),
  makeWave([-0.94, 0.34], 0.5, 2.2, 12),
  makeWave([0.34, -0.94], 0.3, 3.0, 8),
  makeWave([0.57, 0.82], 0.25, 0.3, 6),
  makeWave([-0.71, 0.71], 0.4, 1.8, 15),
  makeWave([0.77, -0.64], 0.35, 2.7, 10),
];

function buildWaveNodes() {
  let height = float(0);
  let dispX = float(0);
  let dispZ = float(0);
  let dhdx = float(0);
  let dhdz = float(0);

  const t = time.mul(WAVE_SPEED);

  for (const w of WAVES) {
    const arg = positionLocal.x
      .mul(w.k * w.dir[0])
      .add(positionLocal.z.mul(w.k * w.dir[1]))
      .sub(t.mul(w.omega))
      .add(w.phase);

    const sinA = sin(arg);
    const cosA = cos(arg);
    const c = w.Qi * w.amp;
    const ampK = w.amp * w.k;

    height = height.add(sinA.mul(w.amp)) as any;
    dispX = dispX.add(cosA.mul(c * w.dir[0])) as any;
    dispZ = dispZ.add(cosA.mul(c * w.dir[1])) as any;

    dhdx = dhdx.add(cosA.mul(ampK * w.dir[0])) as any;
    dhdz = dhdz.add(cosA.mul(ampK * w.dir[1])) as any;
  }

  return { height, dispX, dispZ, dhdx, dhdz };
}

export function createTSLOceanMaterial(): MeshPhysicalNodeMaterial {
  const { height, dispX, dispZ, dhdx, dhdz } = buildWaveNodes();

  const positionNode = Fn(() => {
    return vec3(
      positionLocal.x.add(dispX),
      positionLocal.y.add(height),
      positionLocal.z.add(dispZ),
    );
  })();

  const normalNode = Fn(() => {
    return normalize(vec3(dhdx.negate(), float(1), dhdz.negate()));
  })();

  const material = new MeshPhysicalNodeMaterial();
  material.positionNode = positionNode;
  material.normalNode = normalNode;
  material.color.setHex(0x083060);
  material.roughness = 0.15;
  material.metalness = 0.0;
  material.transparent = true;
  material.opacity = 0.88;
  material.envMapIntensity = 1.0;

  return material;
}
