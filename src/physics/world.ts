import * as CANNON from 'cannon-es';
import { PhysicsBody } from './body';
import type { PhysicsWorldConfig, IPhysicsWorld, IPhysicsBody, PhysicsBodyConfig } from './types';

const DEFAULT_FIXED_DT = 1 / 60;

export class PhysicsWorld implements IPhysicsWorld {
  private world: CANNON.World;
  private _fixedDt: number;
  private _bodies: IPhysicsBody[] = [];

  get fixedDt(): number {
    return this._fixedDt;
  }

  get gravity(): number {
    return this.world.gravity.length();
  }

  get bodies(): readonly IPhysicsBody[] {
    return this._bodies;
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

  createBody(config: PhysicsBodyConfig): IPhysicsBody {
    return new PhysicsBody(config, this);
  }

  addBody(body: IPhysicsBody): void {
    const raw = (body as any).getVendorBody();
    if (raw) this.world.addBody(raw);
    if (!this._bodies.includes(body)) this._bodies.push(body);
  }

  removeBody(body: IPhysicsBody): void {
    const raw = (body as any).getVendorBody();
    if (raw) this.world.removeBody(raw);
    const idx = this._bodies.indexOf(body);
    if (idx !== -1) this._bodies.splice(idx, 1);
  }

  getVendorWorld(): CANNON.World {
    return this.world;
  }

  reset(): void {
    while (this.world.bodies.length) {
      this.world.removeBody(this.world.bodies[0]);
    }
  }

  dispose(): void {
    this.reset();
  }
}

export const physicsWorld = new PhysicsWorld();
