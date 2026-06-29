import { describe, it, expect } from 'vitest';
import { CCIV_WORLD, LOCATION_PRESETS } from './worlds';

describe('world presets', () => {
  it('all CCIV locations have presets', () => {
    for (const locId of CCIV_WORLD.locations) {
      expect(LOCATION_PRESETS[locId]).toBeDefined();
    }
  });

  it('north-sea preset has environment and instances', () => {
    const ns = LOCATION_PRESETS['north-sea'];
    expect(ns.environment).toBeDefined();
    expect(ns.instances).toBeDefined();
    expect(ns.instances.ship).toBeDefined();
    expect(ns.instances.ship.transform.scale).toBe(2.7);
  });
});
