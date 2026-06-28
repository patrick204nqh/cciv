export interface WaveComponent {
  direction: [number, number];
  amplitude: number;
  frequency: number;
  steepness: number;
  speed: number;
  phase: number;
}

export interface ComputedWave {
  dir: [number, number];
  k: number;
  omega: number;
  amp: number;
  Qi: number;
  phase: number;
  speed: number;
}

const G = 9.8;

export function computeWaves(components: WaveComponent[]): ComputedWave[] {
  const n = components.length;
  return components.map((w) => {
    const k = w.frequency;
    const omega = Math.sqrt(G * k);
    const len = Math.sqrt(w.direction[0] ** 2 + w.direction[1] ** 2);
    return {
      dir: [w.direction[0] / len, w.direction[1] / len],
      k,
      omega,
      amp: w.amplitude,
      Qi: w.steepness / (k * w.amplitude * n),
      phase: w.phase,
      speed: w.speed,
    };
  });
}
