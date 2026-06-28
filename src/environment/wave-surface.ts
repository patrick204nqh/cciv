import { worldClock } from '../time';
import { sampleOcean, sampleNormal } from './waves';

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

export const waveSurface: WaveSurface = {
  sample(x: number, z: number, time?: number): WaveSample {
    const t = time ?? worldClock.elapsed * WAVE_SPEED;
    const { height, dispX, dispZ } = sampleOcean(x, z, t);
    const normal = sampleNormal(x, z, t);
    return { height, dispX, dispZ, normal };
  },
};
