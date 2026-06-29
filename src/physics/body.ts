import * as CANNON from 'cannon-es';
import type { ISceneObject } from '../graphics/types';
import type { Vec3Like } from '../graphics/types';
import type { IPhysicsBody, PhysicsBodyConfig } from './types';
import type { PhysicsWorld } from './world';

function quatToEuler(qx: number, qy: number, qz: number, qw: number) {
  const sinP = 2 * (qw * qy - qz * qx);
  return {
    x: Math.atan2(2 * (qw * qx + qy * qz), 1 - 2 * (qx * qx + qy * qy)),
    y: Math.asin(Math.max(-1, Math.min(1, sinP))),
    z: Math.atan2(2 * (qw * qz + qx * qy), 1 - 2 * (qy * qy + qz * qz)),
  };
}

export class PhysicsBody implements IPhysicsBody {
  readonly body: CANNON.Body;
  private _scale: number;
  private _shapeData: { positions: Float32Array; indices: Uint16Array | Uint32Array } | null = null;

  get position(): Vec3Like {
    return { x: this.body.position.x, y: this.body.position.y, z: this.body.position.z };
  }

  get velocity(): Vec3Like {
    return { x: this.body.velocity.x, y: this.body.velocity.y, z: this.body.velocity.z };
  }

  get angularVelocity(): Vec3Like {
    return { x: this.body.angularVelocity.x, y: this.body.angularVelocity.y, z: this.body.angularVelocity.z };
  }

  get quaternion(): Vec3Like & { w: number } {
    return { x: this.body.quaternion.x, y: this.body.quaternion.y, z: this.body.quaternion.z, w: this.body.quaternion.w };
  }

  constructor(config: PhysicsBodyConfig, private world: PhysicsWorld) {
    const rawScale = config.shape.type === 'trimesh' ? (config.shape.scale ?? 1) : 1;
    this._scale = config.shape.type === 'convex' ? 1 : rawScale;
    this.body = new CANNON.Body({ mass: config.mass });

    if (config.shape.type === 'trimesh') {
      const { positions, indices } = config.shape;
      const s = this._scale;
      const posArr: number[] = Array.from(positions);
      const idxArr: number[] = Array.from(indices);
      if (s !== 1) {
        for (let i = 0; i < posArr.length; i++) posArr[i] *= s;
      }
      this.body.addShape(new CANNON.Trimesh(posArr, idxArr));
      this._shapeData = { positions, indices };
    }

    if (config.shape.type === 'convex') {
      const { vertices, faces } = config.shape;
      const vertArr: number[] = Array.from(vertices);
      const faceArr: number[][] = faces;
      this.body.addShape(new CANNON.ConvexPolyhedron({
        vertices: vertArr as any,
        faces: faceArr,
      }));
      this._shapeData = { positions: vertices, indices: new Uint16Array(0) };
    }

    if (config.position) {
      this.body.position.set(config.position[0], config.position[1], config.position[2]);
    }
    if (config.quaternion) {
      this.body.quaternion.set(config.quaternion[0], config.quaternion[1], config.quaternion[2], config.quaternion[3]);
    }

    this.body.linearDamping = 0;
    this.body.angularDamping = 0;
    this.world.addBody(this);
  }

  setPosition(x: number, y: number, z: number): void {
    this.body.position.set(x, y, z);
  }

  setVelocity(x: number, y: number, z: number): void {
    this.body.velocity.set(x, y, z);
  }

  applyLocalForce(x: number, y: number, z: number): void {
    this.body.applyLocalForce(new CANNON.Vec3(x, y, z));
  }

  applyForce(force: [number, number, number], worldPoint: [number, number, number]): void {
    this.body.applyForce(
      new CANNON.Vec3(force[0], force[1], force[2]),
      new CANNON.Vec3(worldPoint[0], worldPoint[1], worldPoint[2]),
    );
  }

  setTorque(x: number, y: number, z: number): void {
    this.body.torque.set(x, y, z);
  }

  setDamping(linear: number, angular: number): void {
    this.body.linearDamping = linear;
    this.body.angularDamping = angular;
    this.body.updateMassProperties();
  }

  getMass(): number {
    return this.body.mass;
  }

  setMass(mass: number): void {
    this.body.mass = mass;
    this.body.updateMassProperties();
  }

  getShapeData(): { positions: Float32Array; indices: Uint16Array | Uint32Array } | null {
    return this._shapeData;
  }

  syncTransform(target: ISceneObject): void {
    const bp = this.body.position;
    target.position.x = bp.x;
    target.position.y = bp.y;
    target.position.z = bp.z;

    const bq = this.body.quaternion;
    const euler = quatToEuler(bq.x, bq.y, bq.z, bq.w);
    target.rotation.x = euler.x;
    target.rotation.y = euler.y;
    target.rotation.z = euler.z;
  }

  readFrom(target: ISceneObject): void {
    const wp = target.worldPosition;
    this.body.position.set(wp.x, wp.y, wp.z);
    const wq = target.worldQuaternion;
    this.body.quaternion.set(wq.x, wq.y, wq.z, wq.w);
  }

  dispose(): void {
    this.world.removeBody(this);
  }
}
