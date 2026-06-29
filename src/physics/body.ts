import * as CANNON from 'cannon-es';
import type { ISceneObject } from '../graphics/types';
import type { Vec3Like } from '../graphics/types';
import type { PhysicsBodyConfig } from './types';
import { physicsWorld } from './world';

function quatToEuler(qx: number, qy: number, qz: number, qw: number) {
  const sinP = 2 * (qw * qy - qz * qx);
  return {
    x: Math.atan2(2 * (qw * qx + qy * qz), 1 - 2 * (qx * qx + qy * qy)),
    y: Math.asin(Math.max(-1, Math.min(1, sinP))),
    z: Math.atan2(2 * (qw * qz + qx * qy), 1 - 2 * (qy * qy + qz * qz)),
  };
}

export class PhysicsBody {
  private body: CANNON.Body;
  private _scale: number;

  constructor(config: PhysicsBodyConfig) {
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
    }

    if (config.shape.type === 'convex') {
      const { vertices, faces } = config.shape;
      const verts = vertices.length / 3;
      const vertArr: number[] = Array.from(vertices);
      const faceArr: number[][] = faces;
      this.body.addShape(new CANNON.ConvexPolyhedron({
        vertices: vertArr,
        faces: faceArr,
      }));
    }

    if (config.position) {
      this.body.position.set(config.position[0], config.position[1], config.position[2]);
    }
    if (config.quaternion) {
      this.body.quaternion.set(config.quaternion[0], config.quaternion[1], config.quaternion[2], config.quaternion[3]);
    }

    physicsWorld._world.addBody(this.body);
  }

  setPosition(x: number, y: number, z: number): void {
    this.body.position.set(x, y, z);
  }

  setDamping(linear: number, angular: number): void {
    this.body.linearDamping = linear;
    this.body.angularDamping = angular;
    this.body.updateMassProperties();
  }

  setVelocity(x: number, y: number, z: number): void {
    this.body.velocity.set(x, y, z);
  }

  applyLocalForce(x: number, y: number, z: number): void {
    this.body.applyLocalForce(new CANNON.Vec3(x, y, z));
  }

  setTorque(x: number, y: number, z: number): void {
    this.body.torque.set(x, y, z);
  }

  sync(target: ISceneObject): void {
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

  get velocity(): Vec3Like {
    return {
      x: this.body.velocity.x,
      y: this.body.velocity.y,
      z: this.body.velocity.z,
    };
  }

  applyForce(force: [number, number, number], worldPoint: [number, number, number]): void {
    this.body.applyForce(
      new CANNON.Vec3(force[0], force[1], force[2]),
      new CANNON.Vec3(worldPoint[0], worldPoint[1], worldPoint[2]),
    );
  }

  dispose(): void {
    physicsWorld._world.removeBody(this.body);
  }
}
