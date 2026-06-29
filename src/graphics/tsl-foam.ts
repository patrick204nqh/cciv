import {
  Fn, float, time, sin, cos, clamp, smoothstep,
  vec3,
} from 'three/tsl';
import type { FoamConfig } from './types';

export function createFoamFn(config: FoamConfig) {
  const threshold = float(config.whitecapThreshold);
  const fadeRate = float(config.whitecapFadeRate);
  const density = float(config.surfaceFoamDensity);

  const whitecapFoam = Fn(([jacobian]: [any]) => {
    return clamp(jacobian.negate().sub(threshold).div(fadeRate), float(0), float(1));
  });

  const surfaceNoise = Fn(([uv]: [any]) => {
    const p = uv.mul(float(3));
    let value = float(0);
    let amplitude = float(0.5);
    let freq = float(1);

    for (let i = 0; i < 4; i++) {
      const n = sin(p.x.mul(freq).add(p.y.mul(freq).mul(float(2.3))).add(time.mul(float(0.3))))
        .mul(cos(p.y.mul(freq).mul(float(1.7)).sub(p.x.mul(freq)).add(time.mul(float(0.2)))));
      value = value.add(n.mul(amplitude));
      freq = freq.mul(float(2));
      amplitude = amplitude.mul(float(0.5));
    }

    return value.mul(density).clamp(0, 1);
  });

  return { whitecapFoam, surfaceNoise };
}
