import { describe, it, expect } from 'vitest';
import { buildCylinder } from './cylinder';

describe('buildCylinder', () => {
  it('creates a cylinder with position attribute', () => {
    const geo = buildCylinder({ rTop: 1, rBot: 1, height: 2 });
    expect(geo.attributes.position.count).toBeGreaterThan(0);
    expect(geo.index?.count).toBeGreaterThan(0);
    expect(geo.attributes.normal).toBeDefined();
    expect(geo.attributes.uv).toBeDefined();
  });
});
