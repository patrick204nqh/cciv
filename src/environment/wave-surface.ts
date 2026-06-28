import { worldClock } from '../time';
import { sampleOcean, sampleNormal } from './waves';
import type { ComputedWave } from './wave-config';

const WAVE_SPEED = 0.42;

export interface WaveSample {
  height: number;
  dispX: number;
  dispZ: number;
  normal: { x: number; y: number; z: number };
}

export interface WaveSurface {
  sample(x: number, z: number, time?: number): WaveSample;
}

let _currentWaves: ComputedWave[] = [];

export function setWaveConfig(waves: ComputedWave[]): void {
  _currentWaves = waves;
}

export function getWaveConfig(): ComputedWave[] {
  return _currentWaves;
}

export const waveSurface: WaveSurface = {
  sample(x: number, z: number, time?: number): WaveSample {
    if (_currentWaves.length === 0) {
      return { height: 0, dispX: 0, dispZ: 0, normal: { x: 0, y: 1, z: 0 } };
    }
    const t = time ?? worldClock.elapsed * WAVE_SPEED;
    const { height, dispX, dispZ } = sampleOcean(x, z, t, _currentWaves);
    const normal = sampleNormal(x, z, t, _currentWaves);
    return { height, dispX, dispZ, normal };
  },
};
