import { describe, it, expect } from 'vitest';
import { LOCATION_PRESETS, CCIV_WORLD } from '../../state/worlds';

describe('location presets', () => {
  it('all CCIV locations have presets', () => {
    for (const locId of CCIV_WORLD.locations) {
      expect(LOCATION_PRESETS[locId]).toBeDefined();
    }
  });

  it('north-sea preset has ship instance', () => {
    const ns = LOCATION_PRESETS['north-sea'];
    expect(ns.instances.ship).toBeDefined();
    expect(ns.instances.ship.transform.scale).toBe(2.7);
  });
});
