import { describe, it, expect } from 'vitest';
import { computeEffectiveEnvironment } from './environment-utils';
import type { EnvironmentState, WaveComponent } from './types';

function baseEnv(overrides?: Partial<EnvironmentState>): EnvironmentState {
  return {
    weather: 'clear',
    wind: { speed: 12, direction: 0.8 },
    waves: [
      { direction: [1, 0], amplitude: 1.4, frequency: 0.157, steepness: 0.45, speed: 1, phase: 0 },
      { direction: [0, 1], amplitude: 0.9, frequency: 0.251, steepness: 0.45, speed: 1, phase: 0.8 },
    ] as WaveComponent[],
    fog: { type: 'exp2', color: '#888', density: 0.001 },
    ...overrides,
  };
}

describe('computeEffectiveEnvironment', () => {
  it('returns base unchanged for clear weather', () => {
    const env = baseEnv({ weather: 'clear' });
    const result = computeEffectiveEnvironment(env);
    expect(result.waves[0].amplitude).toBe(1.4);
    expect(result.waves[0].direction[0]).toBe(1);
  });

  it('applies wind-speed amplitude factor on top of weather multiplier in storm', () => {
    const env = baseEnv({ weather: 'storm' });
    const result = computeEffectiveEnvironment(env);
    const windAmpFactor = Math.sqrt(2.5);
    expect(result.waves[0].amplitude).toBeCloseTo(1.4 * 2.2 * windAmpFactor);
  });

  it('aligns dominant wave direction toward wind', () => {
    const env = baseEnv({ weather: 'storm', wind: { speed: 25, direction: 0 } });
    const result = computeEffectiveEnvironment(env);
    const [dx, dz] = result.waves[0].direction;
    const windAngle = Math.atan2(-Math.cos(0), Math.sin(0));
    const waveAngle = Math.atan2(dz, dx);
    expect(waveAngle).toBeCloseTo(windAngle, 1);
  });

  it('applies both weather multiplier and wind factor in fog', () => {
    const env = baseEnv({ weather: 'fog' });
    const result = computeEffectiveEnvironment(env);
    const expected = 1.4 * 0.4 * Math.sqrt(0.3);
    expect(result.waves[0].amplitude).toBeCloseTo(expected, 5);
  });

  it('keeps wind speed in result', () => {
    const env = baseEnv({ weather: 'storm' });
    const result = computeEffectiveEnvironment(env);
    expect(result.wind?.speed).toBe(12 * 2.5);
  });

  it('handles empty waves array', () => {
    const env = baseEnv({ waves: [], weather: 'storm' });
    const result = computeEffectiveEnvironment(env);
    expect(result.waves).toEqual([]);
  });
});
