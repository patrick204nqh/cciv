import { vec4, uniformArray, Fn, Loop, sin, cos, time, vec3, float, positionLocal, normalize } from 'three/tsl';
import * as THREE from 'three';
import type { FFTConfig, OceanConfig } from './types';

const NUM_WAVES = 128;
const G = 9.81;

export interface WaveField {
  dirArray: ReturnType<typeof uniformArray>;
  paramArray: ReturnType<typeof uniformArray>;
  numWaves: number;
}

export function createWaveField(config: FFTConfig, swellWaves: OceanConfig['waves']): WaveField {
  const components = generateJONSWAPComponents(config);
  const swell = generateSwellComponents(swellWaves);
  const allWaves = [...components, ...swell];

  const waveDirs = allWaves.map(w =>
    new THREE.Vector4(w.dir[0], w.dir[1], w.k, w.omega),
  );
  const waveParams = allWaves.map(w =>
    new THREE.Vector4(w.amp, w.Qi, w.phase, 0),
  );

  return {
    dirArray: uniformArray(waveDirs, 'vec4'),
    paramArray: uniformArray(waveParams, 'vec4'),
    numWaves: allWaves.length,
  };
}

export interface WaveComponentGPU {
  dir: [number, number];
  k: number;
  omega: number;
  amp: number;
  Qi: number;
  phase: number;
}

function createSeededRandom(seed: number): () => number {
  let s = Math.abs(seed) | 0;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function hashConfig(config: FFTConfig): number {
  let h = 0;
  h = ((h << 5) - h + Math.round(config.windSpeed * 100)) | 0;
  h = ((h << 5) - h + Math.round(config.windDirection[0] * 1000)) | 0;
  h = ((h << 5) - h + Math.round(config.windDirection[1] * 1000)) | 0;
  h = ((h << 5) - h + config.fetch) | 0;
  h = ((h << 5) - h + Math.round(config.peakEnhancement * 10)) | 0;
  return h;
}

export function generateJONSWAPComponents(config: FFTConfig): WaveComponentGPU[] {
  const { windSpeed, windDirection, fetch, peakEnhancement } = config;
  const windAngle = Math.atan2(windDirection[1], windDirection[0]);
  const rand = createSeededRandom(hashConfig(config));
  const components: WaveComponentGPU[] = [];

  const alpha = 0.076 * Math.pow(G * fetch / (windSpeed * windSpeed), -0.22);
  const peakOmega = 22 * (G / windSpeed) * Math.pow(fetch * G / (windSpeed * windSpeed), -1 / 3);

  for (let i = 0; i < NUM_WAVES; i++) {
    const freq = 0.01 + (i / NUM_WAVES) * 2;
    const k = freq;
    const omega = Math.sqrt(G * k);

    const sigma = omega <= peakOmega ? 0.07 : 0.09;
    const phillips = alpha * G * G / (omega * omega * omega * omega * omega)
      * Math.exp(-1.25 * Math.pow(peakOmega / omega, 4));
    const peakEnh = Math.pow(peakEnhancement,
      Math.exp(-(omega - peakOmega) * (omega - peakOmega) / (2 * sigma * sigma * peakOmega * peakOmega)));

    const dk = (2 - 0.01) / NUM_WAVES;
    const amplitude = Math.sqrt(phillips * peakEnh * dk);

    const spreadAngle = (rand() - 0.5) * Math.PI * 0.5;
    const dirAngle = windAngle + spreadAngle;
    const Qi = 1.0 / (k * NUM_WAVES);

    components.push({
      dir: [Math.cos(dirAngle), Math.sin(dirAngle)],
      k,
      omega,
      amp: amplitude,
      Qi,
      phase: rand() * Math.PI * 2,
    });
  }

  return components;
}

function generateSwellComponents(waves: OceanConfig['waves']): WaveComponentGPU[] {
  return waves.map(w => ({
    dir: w.direction,
    k: w.k,
    omega: w.omega,
    amp: w.amp,
    Qi: w.Qi,
    phase: w.phase,
  }));
}

export function createGerstnerPositionFn(waveField: WaveField): ReturnType<typeof Fn> {
  return Fn(([pos]: [any]) => {
    const p = vec3(pos);
    const disp = vec3(0);

    Loop(waveField.numWaves, ({ i }) => {
      const d = waveField.dirArray.element(i);
      const a = waveField.paramArray.element(i);
      const dir = d.xy;
      const k = d.z;
      const omega = d.w;
      const amp = a.x;
      const Qi = a.y;
      const ph = a.z;
      const arg = k.mul(dir.x.mul(p.x).add(dir.y.mul(p.z))).sub(omega.mul(time)).add(ph);
      const cosA = cos(arg);
      const sinA = sin(arg);
      disp.x.addAssign(Qi.mul(amp).mul(dir.x).mul(cosA));
      disp.z.addAssign(Qi.mul(amp).mul(dir.y).mul(cosA));
      disp.y.addAssign(amp.mul(sinA));
    });

    return p.add(disp);
  });
}

export function createGerstnerNormalFn(waveField: WaveField): ReturnType<typeof Fn> {
  return Fn(() => {
    const p = positionLocal;
    let dhdx = float(0);
    let dhdz = float(0);

    Loop(waveField.numWaves, ({ i }) => {
      const d = waveField.dirArray.element(i);
      const a = waveField.paramArray.element(i);
      const dir = d.xy;
      const k = d.z;
      const omega = d.w;
      const amp = a.x;
      const ph = a.z;
      const arg = k.mul(dir.x.mul(p.x).add(dir.y.mul(p.z))).sub(omega.mul(time)).add(ph);
      const deriv = amp.mul(k).mul(cos(arg));
      dhdx.addAssign(deriv.mul(dir.x));
      dhdz.addAssign(deriv.mul(dir.y));
    });

    return normalize(vec3(dhdx.negate(), float(1), dhdz.negate()));
  });
}

export function sampleWaveComponentsCPU(
  x: number, z: number, t: number,
  components: WaveComponentGPU[],
): { height: number; dispX: number; dispZ: number; normalX: number; normalY: number; normalZ: number } {
  let h = 0, dx = 0, dz = 0, dhdx = 0, dhdz = 0;

  for (const w of components) {
    const arg = w.k * (w.dir[0] * x + w.dir[1] * z) - w.omega * t + w.phase;
    const cosA = Math.cos(arg);
    const sinA = Math.sin(arg);

    h += w.amp * sinA;
    dx += w.Qi * w.amp * w.dir[0] * cosA;
    dz += w.Qi * w.amp * w.dir[1] * cosA;

    const deriv = w.amp * w.k * cosA;
    dhdx += deriv * w.dir[0];
    dhdz += deriv * w.dir[1];
  }

  const nLen = Math.sqrt(dhdx * dhdx + 1 + dhdz * dhdz);
  return {
    height: h,
    dispX: dx,
    dispZ: dz,
    normalX: -dhdx / nLen,
    normalY: 1 / nLen,
    normalZ: -dhdz / nLen,
  };
}
