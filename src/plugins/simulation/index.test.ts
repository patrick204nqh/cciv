import { describe, it, expect } from 'vitest';
import { simulationPlugin } from './index';

describe('simulationPlugin', () => {
  it('has correct identity', () => {
    expect(simulationPlugin.id).toBe('simulation');
    expect(simulationPlugin.label).toBe('Simulation');
  });

  it('is only active in play mode', () => {
    expect(simulationPlugin.modes.has('play')).toBe(true);
    expect(simulationPlugin.modes.has('edit')).toBe(false);
  });

  it('has priority 30', () => {
    expect(simulationPlugin.priority).toBe(30);
  });

  it('init and destroy are no-ops', () => {
    expect(() => simulationPlugin.init()).not.toThrow();
    expect(() => simulationPlugin.destroy()).not.toThrow();
  });
});
