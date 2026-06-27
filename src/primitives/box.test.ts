import { describe, it, expect } from 'vitest';
import { buildBox } from './box';

describe('buildBox', () => {
  it('creates a box with 24 positions (6 faces × 4 vertices)', () => {
    const geo = buildBox({ w: 1, h: 1, d: 1 });
    expect(geo.attributes.position.count).toBe(24);
    expect(geo.index?.count).toBe(36);
  });

  it('respects dimensions', () => {
    const geo = buildBox({ w: 2, h: 4, d: 6 });
    const pos = geo.attributes.position.array as Float32Array;
    const xs = Array.from(pos).filter((_, i) => i % 3 === 0);
    const ys = Array.from(pos).filter((_, i) => i % 3 === 1);
    const zs = Array.from(pos).filter((_, i) => i % 3 === 2);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(2);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(4);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(6);
  });

  it('computes normals', () => {
    const geo = buildBox({ w: 1, h: 1, d: 1 });
    expect(geo.attributes.normal).toBeDefined();
    expect(geo.attributes.normal.count).toBe(24);
  });

  it('computes UVs', () => {
    const geo = buildBox({ w: 1, h: 1, d: 1 });
    expect(geo.attributes.uv).toBeDefined();
    expect(geo.attributes.uv.count).toBe(24);
  });
});
