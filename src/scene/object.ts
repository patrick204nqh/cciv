import * as THREE from 'three';
import type { ISceneObject, Vec3Like, EulerLike, QuatLike, ReadonlyVec3Like } from './types';

class Vec3Property implements Vec3Like {
  constructor(private target: THREE.Vector3) {}
  get x(): number { return this.target.x; }
  set x(v: number) { this.target.x = v; }
  get y(): number { return this.target.y; }
  set y(v: number) { this.target.y = v; }
  get z(): number { return this.target.z; }
  set z(v: number) { this.target.z = v; }
}

class EulerProperty implements EulerLike {
  constructor(private target: THREE.Euler) {}
  get x(): number { return this.target.x; }
  set x(v: number) { this.target.x = v; }
  get y(): number { return this.target.y; }
  set y(v: number) { this.target.y = v; }
  get z(): number { return this.target.z; }
  set z(v: number) { this.target.z = v; }
}

function snapshot(v: THREE.Vector3): ReadonlyVec3Like {
  return { x: v.x, y: v.y, z: v.z };
}

function quatSnapshot(q: THREE.Quaternion): QuatLike {
  return { x: q.x, y: q.y, z: q.z, w: q.w };
}

export class SceneObject implements ISceneObject {
  readonly object3D: THREE.Object3D;

  private _pos: Vec3Property;
  private _rot: EulerProperty;
  private _scl: Vec3Property;

  constructor(obj: THREE.Object3D) {
    this.object3D = obj;
    this._pos = new Vec3Property(obj.position);
    this._rot = new EulerProperty(obj.rotation);
    this._scl = new Vec3Property(obj.scale);
  }

  get position(): Vec3Like { return this._pos; }
  set position(v: Vec3Like) { this.object3D.position.set(v.x, v.y, v.z); }

  get rotation(): EulerLike { return this._rot; }
  set rotation(v: EulerLike) { this.object3D.rotation.set(v.x, v.y, v.z); }

  get scale(): Vec3Like { return this._scl; }
  set scale(v: Vec3Like) { this.object3D.scale.set(v.x, v.y, v.z); }

  get visible(): boolean { return this.object3D.visible; }
  set visible(v: boolean) { this.object3D.visible = v; }

  get worldPosition(): ReadonlyVec3Like {
    const v = new THREE.Vector3();
    this.object3D.getWorldPosition(v);
    return snapshot(v);
  }

  get worldQuaternion(): QuatLike {
    const q = new THREE.Quaternion();
    this.object3D.getWorldQuaternion(q);
    return quatSnapshot(q);
  }

  get forward(): ReadonlyVec3Like {
    const v = new THREE.Vector3();
    this.object3D.getWorldDirection(v);
    return snapshot(v);
  }

  get right(): ReadonlyVec3Like {
    const q = this.object3D.quaternion;
    const v = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    return snapshot(v);
  }

  get up(): ReadonlyVec3Like {
    const q = this.object3D.quaternion;
    const v = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    return snapshot(v);
  }

  get parent(): ISceneObject | null {
    return this.object3D.parent ? new SceneObject(this.object3D.parent) : null;
  }

  get children(): readonly ISceneObject[] {
    return this.object3D.children.map(c => new SceneObject(c));
  }

  addChild(child: ISceneObject): this {
    this.object3D.add(child.object3D);
    return this;
  }

  removeChild(child: ISceneObject): this {
    this.object3D.remove(child.object3D);
    return this;
  }

  detach(): this {
    this.object3D.removeFromParent();
    return this;
  }

  findChild(predicate: (child: ISceneObject) => boolean, deep?: boolean): ISceneObject | null {
    if (deep) {
      const result: ISceneObject[] = [];
      this.object3D.traverse((child) => {
        if (child === this.object3D) return;
        const wrapped = new SceneObject(child);
        if (predicate(wrapped)) result.push(wrapped);
      });
      return result[0] ?? null;
    }
    for (const child of this.object3D.children) {
      const wrapped = new SceneObject(child);
      if (predicate(wrapped)) return wrapped;
    }
    return null;
  }

  traverse(fn: (child: ISceneObject) => void): this {
    this.object3D.traverse((child) => fn(new SceneObject(child)));
    return this;
  }

  traverseAncestors(fn: (ancestor: ISceneObject) => void): this {
    let p = this.object3D.parent;
    while (p) {
      fn(new SceneObject(p));
      p = p.parent;
    }
    return this;
  }

  traverseMeshes(fn: (obj: ISceneObject) => void): this {
    this.object3D.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        fn(new SceneObject(child));
      }
    });
    return this;
  }

  clone(): ISceneObject {
    return new SceneObject(this.object3D.clone());
  }

  dispose(): void {
    this.object3D.removeFromParent();
  }
}
