import { describe, it, expect, vi } from 'vitest';
import * as CANNON from 'cannon-es';
import { HydrodynamicsSolver } from './hydrodynamics';

function mockWaveSurface(height = 5) {
  return {
    sample: vi.fn().mockReturnValue({ height, dispX: 0, dispZ: 0, normal: { x: 0, y: 1, z: 0 } }),
  };
}

function makeBody(pos = [0, 0, 0], vel = [0, 0, 0], aVel = [0, 0, 0], mass = 5000): CANNON.Body {
  const b = new CANNON.Body({ mass });
  b.position.set(pos[0], pos[1], pos[2]);
  b.velocity.set(vel[0], vel[1], vel[2]);
  b.angularVelocity.set(aVel[0], aVel[1], aVel[2]);
  return b;
}

describe('HydrodynamicsSolver', () => {
  it('applies buoyancy force for submerged points', () => {
    const verts = new Float32Array([0, -2, 0]);
    const solver = new HydrodynamicsSolver(verts, {
      density: 1.0,
      dragCoefficient: 0.4,
      slammingCoefficient: 0.3,
      addedMassFactor: 0,
    });
    const body = makeBody([0, 0, 0], [0, 0, 0], [0, 0, 0]);
    const origForce = body.force.length();

    solver.apply(body, mockWaveSurface(), 9.82, 0.016);

    expect(body.force.length()).toBeGreaterThan(origForce);
    expect(body.force.y).toBeGreaterThan(0);
  });

  it('no forces when nothing is submerged', () => {
    const verts = new Float32Array([0, 10, 0]);
    const solver = new HydrodynamicsSolver(verts, {
      density: 1.0,
      dragCoefficient: 0.4,
      slammingCoefficient: 0.3,
      addedMassFactor: 0,
    });
    const body = makeBody([0, 0, 0], [5, 0, 0], [0, 0, 0]);
    const initialForce = body.force.length();

    solver.apply(body, mockWaveSurface(5), 9.82, 0.016);

    expect(body.force.length()).toBe(initialForce);
  });

  it('applies drag opposing velocity for submerged points', () => {
    const verts = new Float32Array([0, -2, 0]);
    const solver = new HydrodynamicsSolver(verts, {
      density: 1.0,
      dragCoefficient: 0.4,
      slammingCoefficient: 0.3,
      addedMassFactor: 0,
    });
    const body = makeBody([0, 0, 0], [10, 0, 0]);

    solver.apply(body, mockWaveSurface(), 9.82, 0.016);

    const fx = body.force.x;
    expect(fx).toBeLessThan(0);
  });

  it('applies slamming force on rapid water entry', () => {
    const verts = new Float32Array([0, -2, 0]);
    const solver = new HydrodynamicsSolver(verts, {
      density: 1.0,
      dragCoefficient: 0.4,
      slammingCoefficient: 0.3,
      addedMassFactor: 0,
    });
    const body = makeBody([0, 0, 0], [0, -5, 0]);

    solver.apply(body, mockWaveSurface(), 9.82, 0.016);

    const slamY = body.force.y;
    const buoyancyOnly = 5000 * 9.82 * 1.0;
    expect(slamY).toBeGreaterThan(buoyancyOnly);
  });

  it('adjusts body mass for added mass', () => {
    const verts = new Float32Array([0, -5, 0, 10, -5, 0, 0, -5, 10]);
    const solver = new HydrodynamicsSolver(verts, {
      density: 1.0,
      dragCoefficient: 0.4,
      slammingCoefficient: 0.3,
      addedMassFactor: 2.0,
    });
    const body = makeBody([0, 0, 0], [0, 0, 0], [0, 0, 0], 5000);

    solver.apply(body, mockWaveSurface(), 9.82, 0.016);

    expect(body.mass).toBeGreaterThan(5000);
  });

  it('resets body mass when nothing is submerged', () => {
    const verts = new Float32Array([0, 10, 0]);
    const solver = new HydrodynamicsSolver(verts, {
      density: 1.0,
      dragCoefficient: 0.4,
      slammingCoefficient: 0.3,
      addedMassFactor: 2.0,
    });
    const body = makeBody([0, 0, 0], [0, 0, 0], [0, 0, 0], 5000);

    solver.apply(body, mockWaveSurface(5), 9.82, 0.016);

    expect(body.mass).toBeCloseTo(5000);
  });
});
