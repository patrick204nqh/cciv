import { describe, it, expect } from 'vitest';
import { buildPlane } from './plane';

describe('buildPlane', () => {
  it('creates a plane with position attribute', () => {
    const geo = buildPlane({ w: 10, h: 10 });
    expect(geo.attributes.position.count).toBe(4);
    expect(geo.index?.count).toBe(6);
  });
});
