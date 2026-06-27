import { describe, it, expect } from 'vitest';
import { CCIV_WORLD, LOCATION_PRESETS } from './worlds';

describe('world presets', () => {
  it('defines CCIV world with north-sea location', () => {
    expect(CCIV_WORLD.locations).toContain('north-sea');
    expect(LOCATION_PRESETS['north-sea']).toBeDefined();
    expect(LOCATION_PRESETS['north-sea'].environment).toBeDefined();
    expect(LOCATION_PRESETS['north-sea'].instances).toBeDefined();
  });
});
