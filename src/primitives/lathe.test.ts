import { describe, it, expect } from 'vitest';
import { buildLathe } from './lathe';

describe('buildLathe', () => {
  it('creates a lathe geometry from points', () => {
    const geo = buildLathe({
      points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 2 }, { x: 0, y: 2 }],
    });
    expect(geo.attributes.position.count).toBeGreaterThan(0);
    expect(geo.index?.count).toBeGreaterThan(0);
  });
});
