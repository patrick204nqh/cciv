import { describe, it, expect } from 'vitest';
import { buildSphere } from './sphere';

describe('buildSphere', () => {
  it('creates a sphere with position attribute', () => {
    const geo = buildSphere({ radius: 1 });
    expect(geo.attributes.position.count).toBeGreaterThan(0);
    expect(geo.index?.count).toBeGreaterThan(0);
  });
});
