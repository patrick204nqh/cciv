import { describe, it, expect } from 'vitest';
import { createDefaultState } from './defaults';

describe('createDefaultState', () => {
  it('returns a valid AppState', () => {
    const state = createDefaultState();
    expect(state.activeLocation).toBe('north-sea');
    expect(state.environment.sky.gradientTop).toBeTruthy();
    expect(state.environment.waves.length).toBe(8);
    expect(state.instances.ship.visible).toBe(true);
    expect(Object.keys(state.locations)).toContain('north-sea');
  });
});
