import { describe, it, expect } from 'vitest';
import { createHullCollider, computeConvexHull } from './hull-collider';

describe('createHullCollider', () => {
  it('produces a trimesh shape config from positions and indices', () => {
    const pos = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const idx = new Uint16Array([0, 1, 2]);
    const collider = createHullCollider(pos, idx);
    const trimesh = collider.asTrimesh();
    expect(trimesh.type).toBe('trimesh');
    expect(trimesh.positions).toBe(pos);
    expect(trimesh.indices).toBe(idx);
  });

  it('produces a convex hull shape config', () => {
    const pos = new Float32Array([
      0, 0, 0,
      2, 0, 0,
      1, 2, 0,
      1, 1, 2,
    ]);
    const idx = new Uint16Array([0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2]);
    const collider = createHullCollider(pos, idx);
    const convex = collider.asConvexHull();
    expect(convex.type).toBe('convex');
    expect(convex.vertices.length).toBeGreaterThanOrEqual(12);
    expect(convex.faces.length).toBeGreaterThanOrEqual(4);
  });
});

describe('computeConvexHull', () => {
  it('returns a tetrahedron for 4 non-coplanar input points', () => {
    const pos = new Float32Array([
      0, 0, 0,
      2, 0, 0,
      1, 2, 0,
      1, 1, 2,
    ]);
    const hull = computeConvexHull(pos);
    expect(hull.type).toBe('convex');
    expect(hull.vertices).toBeDefined();
    expect(hull.faces.length).toBe(4);
  });

  it('returns all vertices for a triangle (degenerate)', () => {
    const pos = new Float32Array([0, 0, 0, 2, 0, 0, 1, 2, 0]);
    const hull = computeConvexHull(pos);
    expect(hull.faces.length).toBe(1);
  });
});
