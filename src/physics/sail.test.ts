import { describe, it, expect, vi } from 'vitest';
import { SailForceSolver } from './sail';
import type { IPhysicsBody } from './types';

function makeBody(quat?: { x: number; y: number; z: number; w: number }, vel?: [number, number, number]): IPhysicsBody {
  return {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: vel?.[0] ?? 0, y: vel?.[1] ?? 0, z: vel?.[2] ?? 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    quaternion: quat ?? { x: 0, y: 0, z: 0, w: 1 },
    setPosition: vi.fn(),
    setVelocity: vi.fn(),
    applyLocalForce: vi.fn(),
    applyForce: vi.fn(),
    setTorque: vi.fn(),
    setDamping: vi.fn(),
    getMass: vi.fn(() => 5000),
    setMass: vi.fn(),
    syncTransform: vi.fn(),
    getShapeData: vi.fn(() => null),
    dispose: vi.fn(),
  } satisfies IPhysicsBody as IPhysicsBody
}

describe('SailForceSolver', () => {
  it('applies force when throttle is positive and wind is from behind', () => {
    const solver = new SailForceSolver({ area: 120, liftCoeff: 0.6, dragCoeff: 0.3 });
    const body = makeBody();

    solver.apply(body, 12, 0, -1, 1);

    expect(body.applyLocalForce).toHaveBeenCalledWith(0, 0, expect.any(Number));
  });

  it('does nothing when throttle is zero', () => {
    const solver = new SailForceSolver({ area: 120, liftCoeff: 0.6, dragCoeff: 0.3 });
    const body = makeBody();

    solver.apply(body, 12, 0, -1, 0);

    expect(body.applyLocalForce).not.toHaveBeenCalled();
  });

  it('applies stronger force in higher wind', () => {
    const solver = new SailForceSolver({ area: 120, liftCoeff: 0.6, dragCoeff: 0.3 });
    const body1 = makeBody();
    const body2 = makeBody();

    solver.apply(body1, 10, 0, -1, 1);
    solver.apply(body2, 20, 0, -1, 1);

    const call1 = (body1.applyLocalForce as any).mock.calls[0]
    const call2 = (body2.applyLocalForce as any).mock.calls[0]
    expect(Math.abs(call2[2])).toBeGreaterThan(Math.abs(call1[2]));
  });

  it('applies force when ship is moving (apparent wind effect)', () => {
    const solver = new SailForceSolver({ area: 120, liftCoeff: 0.6, dragCoeff: 0.3 });
    const body = makeBody(undefined, [0, 0, -5]);

    solver.apply(body, 12, 0, -1, 1);

    expect(body.applyLocalForce).toHaveBeenCalledWith(0, 0, expect.any(Number));
  });

  it('produces force in local forward direction', () => {
    const solver = new SailForceSolver({ area: 120, liftCoeff: 0.6, dragCoeff: 0.3 });
    const angle = Math.PI / 4;
    const qw = Math.cos(angle / 2);
    const qy = Math.sin(angle / 2);
    const body = makeBody({ x: 0, y: qy, z: 0, w: qw });

    solver.apply(body, 12, 0, -1, 1);

    expect(body.applyLocalForce).toHaveBeenCalledWith(0, 0, expect.any(Number));
  });
});
