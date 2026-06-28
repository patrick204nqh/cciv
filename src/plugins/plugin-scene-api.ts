import * as THREE from 'three';
import type { IScene } from '../scene/types';
import { SceneObject } from '../scene/object';

export interface PluginSceneAPI {
  add(object: THREE.Object3D): void;
  remove(object: THREE.Object3D): void;
  getObjectByName(name: string): THREE.Object3D | undefined;
  traverse(callback: (object: THREE.Object3D) => void): void;
}

export function createPluginSceneAPI(scene: IScene): PluginSceneAPI {
  return {
    add(object: THREE.Object3D) {
      scene.add(new SceneObject(object));
    },
    remove(object: THREE.Object3D) {
      scene.remove(new SceneObject(object));
    },
    getObjectByName(name: string) {
      const obj = scene.getObjectByName(name);
      return (obj as any)?.object3D;
    },
    traverse(callback: (object: THREE.Object3D) => void) {
      scene.traverse((child) => callback((child as any).object3D));
    },
  };
}
