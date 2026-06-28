import * as THREE from 'three';
import type { IScene, ISceneObject, SceneHandle, FogSpec } from './types';
import { SceneObject } from './object';

export class SceneAdapter implements IScene {
  constructor(private scene: THREE.Scene) {}

  add(child: ISceneObject): void {
    this.scene.add((child as any).object3D);
  }

  remove(child: ISceneObject): void {
    this.scene.remove((child as any).object3D);
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
    return obj ? new SceneObject(obj) : undefined;
  }

  traverse(fn: (obj: ISceneObject) => void): void {
    this.scene.traverse((child) => fn(new SceneObject(child)));
  }
}
