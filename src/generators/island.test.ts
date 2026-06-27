import { describe, it, expect } from 'vitest';
import { generateIsland } from './island';

describe('generateIsland', () => {
  it('generates an island shape with position attribute', () => {
    const geo = generateIsland({ radius: 40, height: 12, segments: 32 });
    expect(geo.attributes.position.count).toBeGreaterThan(0);
    expect(geo.index?.count).toBeGreaterThan(0);
  });
});
