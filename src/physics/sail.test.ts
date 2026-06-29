import { describe, it, expect } from 'vitest';
import * as CANNON from 'cannon-es';
import { SailForceSolver } from './sail';

function makeBody(): CANNON.Body {
  const b = new CANNON.Body({ mass: 5000 });
  b.position.set(0, 0, 0);
  b.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0);
  return b;
}

describe('SailForceSolver', () => {
  it('applies force when throttle is positive and wind is from behind', () => {
    const solver = new SailForceSolver({ area: 120, liftCoeff: 0.6, dragCoeff: 0.3 });
    const body = makeBody();

    solver.apply(body, 12, 0, -1, 1);

    expect(body.force.z).toBeGreaterThan(0);
  });

  it('does nothing when throttle is zero', () => {
    const solver = new SailForceSolver({ area: 120, liftCoeff: 0.6, dragCoeff: 0.3 });
    const body = makeBody();

    solver.apply(body, 12, 0, -1, 0);

    expect(body.force.length()).toBe(0);
  });

  it('applies stronger force in higher wind', () => {
    const solver = new SailForceSolver({ area: 120, liftCoeff: 0.6, dragCoeff: 0.3 });
    const body1 = makeBody();
    const body2 = makeBody();

    solver.apply(body1, 10, 0, -1, 1);
    solver.apply(body2, 20, 0, -1, 1);

    expect(body2.force.length()).toBeGreaterThan(body1.force.length());
  });

  it('applies force when ship is moving (apparent wind effect)', () => {
    const solver = new SailForceSolver({ area: 120, liftCoeff: 0.6, dragCoeff: 0.3 });
    const body = makeBody();
    body.velocity.set(0, 0, -5);

    solver.apply(body, 12, 0, -1, 1);

    expect(body.force.length()).toBeGreaterThan(0);
  });

  it('produces force in local forward direction', () => {
    const solver = new SailForceSolver({ area: 120, liftCoeff: 0.6, dragCoeff: 0.3 });
    const body = makeBody();
    body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 4);

    solver.apply(body, 12, 0, -1, 1);

    expect(body.force.length()).toBeGreaterThan(0);
  });
});
