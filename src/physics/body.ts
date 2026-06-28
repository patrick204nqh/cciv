import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import type { ISceneObject } from '../scene/types';
import type { PhysicsBodyConfig } from './types';
import { physicsWorld } from './world';

export class PhysicsBody {
  readonly body: CANNON.Body;
  private _scale: number;
  private _tmpVec = new THREE.Vector3();
  private _tmpQuat = new THREE.Quaternion();
  private _tmpEuler = new THREE.Euler();

  constructor(config: PhysicsBodyConfig) {
    this._scale = config.shape.type === 'trimesh' ? (config.shape.scale ?? 1) : 1;
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

    if (config.position) {
      this.body.position.set(config.position[0], config.position[1], config.position[2]);
    }
    if (config.quaternion) {
      this.body.quaternion.set(config.quaternion[0], config.quaternion[1], config.quaternion[2], config.quaternion[3]);
    }

    physicsWorld.world.addBody(this.body);
  }

  sync(target: ISceneObject): void {
    const bp = this.body.position;
    target.position.x = bp.x;
    target.position.y = bp.y;
    target.position.z = bp.z;

    const bq = this.body.quaternion;
    this._tmpQuat.set(bq.x, bq.y, bq.z, bq.w);
    this._tmpEuler.setFromQuaternion(this._tmpQuat);
    target.rotation.x = this._tmpEuler.x;
    target.rotation.y = this._tmpEuler.y;
    target.rotation.z = this._tmpEuler.z;
  }

  readFrom(target: ISceneObject): void {
    const wp = target.worldPosition;
    this.body.position.set(wp.x, wp.y, wp.z);
    const wq = target.worldQuaternion;
    this.body.quaternion.set(wq.x, wq.y, wq.z, wq.w);
  }

  get velocity(): THREE.Vector3 {
    return this._tmpVec.set(this.body.velocity.x, this.body.velocity.y, this.body.velocity.z);
  }

  applyForce(force: [number, number, number], worldPoint: [number, number, number]): void {
    this.body.applyForce(
      new CANNON.Vec3(force[0], force[1], force[2]),
      new CANNON.Vec3(worldPoint[0], worldPoint[1], worldPoint[2]),
    );
  }

  dispose(): void {
    physicsWorld.world.removeBody(this.body);
  }
}
