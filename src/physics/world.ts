import * as CANNON from 'cannon-es';
import type { PhysicsWorldConfig } from './types';

const DEFAULT_FIXED_DT = 1 / 60;

export class PhysicsWorld {
  private world: CANNON.World;
  private _fixedDt: number;

  get fixedDt(): number {
    return this._fixedDt;
  }

  get gravity(): number {
    return this.world.gravity.length();
  }

  get allBodies(): readonly CANNON.Body[] {
    return this.world.bodies;
  }

  /** @internal Gate-internal access to the raw cannon-es world. */
  get _world(): CANNON.World {
    return this.world;
  }

  constructor(config?: PhysicsWorldConfig) {
    this._fixedDt = config?.fixedDt ?? DEFAULT_FIXED_DT;
    this.world = new CANNON.World();
    const gravity = config != null && config.gravity != null ? config.gravity : 9.82;
    this.world.gravity.set(0, -gravity, 0);
    (this.world.solver as any).iterations = 10;
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
  }

  step(dt: number): void {
    this.world.step(this._fixedDt, dt, 3);
  }

  reset(): void {
    while (this.world.bodies.length) {
      this.world.removeBody(this.world.bodies[0]);
    }
  }
}

export const physicsWorld = new PhysicsWorld();
