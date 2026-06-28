import * as THREE from 'three';
import type { IScene, ISceneObject, SceneHandle, FogSpec, IMaterial } from './types';
import { SceneObject } from './object';

export class SceneAdapter implements IScene {
  private idCache = new Map<string, ISceneObject>();
  private vendorCache = new Map<THREE.Object3D, string>();

  constructor(private scene: THREE.Scene) {}

  private wrap(obj: THREE.Object3D): ISceneObject {
    const id = obj.uuid;
    const existing = this.idCache.get(id);
    if (existing) return existing;
    const wrapper = new SceneObject(obj);
    this.idCache.set(id, wrapper);
    this.vendorCache.set(obj, id);
    return wrapper;
  }

  add(child: ISceneObject): void {
    const vendor = this.vendorCache.get((child as any).object3D)
      ?? (child as any).object3D;
    this.scene.add(vendor);
    this.idCache.set(child.id, child);
    this.vendorCache.set(vendor, child.id);
  }

  remove(child: ISceneObject): void {
    const vendor = this.vendorCache.get((child as any).object3D)
      ?? (child as any).object3D;
    this.scene.remove(vendor);
    this.idCache.delete(child.id);
    this.vendorCache.delete(vendor);
  }

  createMesh(geometry: THREE.BufferGeometry, material: IMaterial): ISceneObject {
    const vendorMat = (material as any)._vendor;
    const mesh = new THREE.Mesh(geometry, vendorMat);
    return this.wrap(mesh);
  }

  get fog(): FogSpec | null {
    const f = this.scene.fog;
    if (!f) return null;
    if (f instanceof THREE.FogExp2) {
      return { type: 'exp2', color: f.color.getHexString(), density: f.density };
    }
    if (f instanceof THREE.Fog) {
      return { type: 'linear', color: f.color.getHexString(), near: f.near, far: f.far };
    }
    return null;
  }

  set fog(v: FogSpec | null) {
    if (!v) { this.scene.fog = null; return; }
    if (v.type === 'exp2') {
      this.scene.fog = new THREE.FogExp2(new THREE.Color(v.color), v.density ?? 0.0018);
    } else {
      this.scene.fog = new THREE.Fog(new THREE.Color(v.color), v.near ?? 0, v.far ?? 2000);
    }
  }

  get background(): string | null {
    const b = this.scene.background;
    if (b instanceof THREE.Color) return b.getHexString();
    return null;
  }

  set background(v: string | null) {
    this.scene.background = v ? new THREE.Color(v) : null;
  }

  getObjectByName(name: string): ISceneObject | undefined {
    const obj = this.scene.getObjectByName(name);
    return obj ? this.wrap(obj) : undefined;
  }

  traverse(fn: (obj: ISceneObject) => void): void {
    this.scene.traverse((child) => fn(this.wrap(child)));
  }
}
