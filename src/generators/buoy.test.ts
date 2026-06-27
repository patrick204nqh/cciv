import { describe, it, expect } from 'vitest';
import { generateBuoy } from './buoy';

describe('generateBuoy', () => {
  it('generates a buoy shape with position attribute', () => {
    const geo = generateBuoy({ height: 3, radius: 0.8, poleHeight: 1.5 });
    expect(geo.attributes.position.count).toBeGreaterThan(0);
    expect(geo.index?.count).toBeGreaterThan(0);
  });
});
