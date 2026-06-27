import { describe, it, expect } from 'vitest';
import { generateHull } from './hull';

describe('generateHull', () => {
  it('generates a hull shape with position attribute', () => {
    const geo = generateHull({ length: 30, beam: 8, depth: 5, bowCurve: 0.4 });
    expect(geo.attributes.position.count).toBeGreaterThan(0);
    expect(geo.index?.count).toBeGreaterThan(0);
    expect(geo.attributes.normal).toBeDefined();
  });

  it('generates wider hull with larger beam', () => {
    const narrow = generateHull({ length: 30, beam: 4, depth: 5, bowCurve: 0.4 });
    const wide = generateHull({ length: 30, beam: 12, depth: 5, bowCurve: 0.4 });
    const narrowPos = narrow.attributes.position.array as Float32Array;
    const widePos = wide.attributes.position.array as Float32Array;
    const narrowMaxX = Math.max(...Array.from(narrowPos).filter((_, i) => i % 3 === 0));
    const wideMaxX = Math.max(...Array.from(widePos).filter((_, i) => i % 3 === 0));
    expect(wideMaxX).toBeGreaterThan(narrowMaxX);
  });
});
