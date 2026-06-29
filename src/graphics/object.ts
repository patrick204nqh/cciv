import * as THREE from 'three';
import type { ISceneObject, Vec3Like, EulerLike, QuatLike, ReadonlyVec3Like } from './types';
import { BufferGeometry, Material, Mesh, Object3D, Quaternion, Vector3, RepeatWrapping, Texture } from 'three';
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
  readonly id: string;
  readonly name: string;
  readonly type: string;

  private readonly _obj: Object3D;

  private _pos: Vec3Property;
  private _rot: EulerProperty;
  private _scl: Vec3Property;

  constructor(obj: Object3D) {
    this.id = obj.uuid;
    this.name = obj.name;
    this.type = obj.type;
    this._obj = obj;
    this._pos = new Vec3Property(obj.position);
    this._rot = new EulerProperty(obj.rotation);
    this._scl = new Vec3Property(obj.scale);
  }

  get userData(): Record<string, any> {
    return this._obj.userData;
  }

  get position(): Vec3Like { return this._pos; }
  set position(v: Vec3Like) { this._obj.position.set(v.x, v.y, v.z); }

  get rotation(): EulerLike { return this._rot; }
  set rotation(v: EulerLike) { this._obj.rotation.set(v.x, v.y, v.z); }

  get scale(): Vec3Like { return this._scl; }
  set scale(v: Vec3Like) { this._obj.scale.set(v.x, v.y, v.z); }

  get visible(): boolean { return this._obj.visible; }
  set visible(v: boolean) { this._obj.visible = v; }

  get worldPosition(): ReadonlyVec3Like {
    const v = new Vector3();
    this._obj.getWorldPosition(v);
    return snapshot(v);
  }

  get worldQuaternion(): QuatLike {
    const q = new Quaternion();
    this._obj.getWorldQuaternion(q);
    return quatSnapshot(q);
  }

  get forward(): ReadonlyVec3Like {
    const v = new Vector3();
    this._obj.getWorldDirection(v);
    return snapshot(v);
  }

  get right(): ReadonlyVec3Like {
    const q = this._obj.quaternion;
    const v = new Vector3(1, 0, 0).applyQuaternion(q);
    return snapshot(v);
  }

  get up(): ReadonlyVec3Like {
    const q = this._obj.quaternion;
    const v = new Vector3(0, 1, 0).applyQuaternion(q);
    return snapshot(v);
  }

  get parent(): ISceneObject | null {
    return this._obj.parent ? new SceneObject(this._obj.parent) : null;
  }

  get children(): readonly ISceneObject[] {
    return this._obj.children.map(c => new SceneObject(c));
  }

  addChild(child: ISceneObject): this {
    this._obj.add((child as SceneObject)._obj);
    return this;
  }

  removeChild(child: ISceneObject): this {
    this._obj.remove((child as SceneObject)._obj);
    return this;
  }

  detach(): this {
    this._obj.removeFromParent();
    return this;
  }

  findChild(predicate: (child: ISceneObject) => boolean, deep?: boolean): ISceneObject | null {
    if (deep) {
      const result: ISceneObject[] = [];
      this._obj.traverse((child) => {
        if (child === this._obj) return;
        const wrapped = new SceneObject(child);
        if (predicate(wrapped)) result.push(wrapped);
      });
      return result[0] ?? null;
    }
    for (const child of this._obj.children) {
      const wrapped = new SceneObject(child);
      if (predicate(wrapped)) return wrapped;
    }
    return null;
  }

  traverse(fn: (child: ISceneObject) => void): this {
    this._obj.traverse((child) => fn(new SceneObject(child)));
    return this;
  }

  traverseAncestors(fn: (ancestor: ISceneObject) => void): this {
    let p = this._obj.parent;
    while (p) {
      fn(new SceneObject(p));
      p = p.parent;
    }
    return this;
  }

  traverseMeshes(fn: (obj: ISceneObject) => void): this {
    this._obj.traverse((child) => {
      if (child instanceof Mesh) {
        fn(new SceneObject(child));
      }
    });
    return this;
  }

  updateWorldMatrix(updateParents: boolean, updateChildren: boolean): void {
    this._obj.updateWorldMatrix(updateParents, updateChildren);
  }

  clone(): ISceneObject {
    return new SceneObject(this._obj.clone());
  }

  dispose(): void {
    this._obj.removeFromParent();
    this._obj.traverse((child: Object3D) => {
      const mesh = child as Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material: Material) => material.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });
  }

  getWorldMatrix(): Float32Array {
    return new Float32Array(this._obj.matrixWorld.elements);
  }

  setMeshTexture(meshName: string, textureType: string, texture: any): void {
    this._obj.traverse((child) => {
      const mesh = child as Mesh;
      if (mesh.isMesh && mesh.name === meshName) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => (m as any)[textureType] = texture);
        } else {
          (mesh.material as any)[textureType] = texture;
        }
        (mesh.material as any).needsUpdate = true;
      }
    });
  }

  setMeshTextureRepeat(meshName: string, textureType: string, repeatX: number, repeatY: number): void {
    this._obj.traverse((child) => {
      const mesh = child as Mesh;
      if (mesh.isMesh && mesh.name === meshName) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          const tex = (mat as any)[textureType] as Texture | undefined;
          if (tex) {
            tex.wrapS = tex.wrapT = RepeatWrapping;
            tex.repeat.set(repeatX, repeatY);
            tex.needsUpdate = true;
          }
        }
      }
    });
  }

  getGeometryData(): { positions: Float32Array; indices: Uint16Array | Uint32Array } | null {
    const mesh = this._obj as Mesh;
    if (!mesh.isMesh) return null;
    const geometry = mesh.geometry as BufferGeometry;
    const positions = geometry.attributes.position;
    const indices = geometry.index;
    if (!positions || !indices) return null;
    return { positions: positions.array as Float32Array, indices: indices.array as Uint16Array | Uint32Array };
  }
}
