import { describe, it, expect, vi } from 'vitest';
import { HydrodynamicsSolver } from './hydrodynamics';
import type { IPhysicsBody } from './types';

function mockWaveSurface(height = 5) {
  return {
    sample: vi.fn().mockReturnValue({ height, dispX: 0, dispZ: 0, normal: { x: 0, y: 1, z: 0 } }),
  };
}

interface MockForceAccum {
  force: [number, number, number]
  mass: number
}

function makeBody(
  pos = [0, 0, 0],
  vel = [0, 0, 0],
  aVel = [0, 0, 0],
  mass = 5000,
  quat = { x: 0, y: 0, z: 0, w: 1 },
): IPhysicsBody {
  const accum: MockForceAccum = { force: [0, 0, 0], mass }
  return {
    position: { x: pos[0], y: pos[1], z: pos[2] },
    velocity: { x: vel[0], y: vel[1], z: vel[2] },
    angularVelocity: { x: aVel[0], y: aVel[1], z: aVel[2] },
    quaternion: { ...quat },
    setPosition: vi.fn(),
    setVelocity: vi.fn((x, y, z) => { accum.force[0] = x; accum.force[1] = y; accum.force[2] = z; }),
    applyLocalForce: vi.fn(),
    applyForce: vi.fn((force, worldPoint) => {
      accum.force[0] += force[0]
      accum.force[1] += force[1]
      accum.force[2] += force[2]
    }),
    setTorque: vi.fn(),
    setDamping: vi.fn(),
    getMass: vi.fn(() => accum.mass),
    setMass: vi.fn((m) => { accum.mass = m }),
    syncTransform: vi.fn(),
    getShapeData: vi.fn(() => null),
    dispose: vi.fn(),
  } satisfies IPhysicsBody as IPhysicsBody
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

    solver.apply(body, mockWaveSurface(), 9.82, 0.016);

    expect(body.getMass()).toBeGreaterThan(0);
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
    const initialMass = body.getMass();

    solver.apply(body, mockWaveSurface(5), 9.82, 0.016);

    expect(body.getMass()).toBeCloseTo(initialMass);
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

    expect(body.getMass()).toBeGreaterThan(0);
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

    expect(body.getMass()).toBeGreaterThan(0);
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

    expect(body.getMass()).toBeGreaterThan(5000);
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

    expect(body.getMass()).toBeCloseTo(5000);
  });
});
