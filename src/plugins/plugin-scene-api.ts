import * as THREE from 'three';
import type { IScene } from '../scene/types';

export interface PluginSceneAPI {
  add(object: THREE.Object3D): void;
  remove(object: THREE.Object3D): void;
  getObjectByName(name: string): THREE.Object3D | undefined;
  traverse(callback: (object: THREE.Object3D) => void): void;
}

export function createPluginSceneAPI(scene: IScene): PluginSceneAPI {
  return {
    add(object: THREE.Object3D) {
      scene.add({ object3D: object } as any);
    },
    remove(object: THREE.Object3D) {
      scene.remove({ object3D: object } as any);
    },
    getObjectByName(name: string) {
      const obj = scene.getObjectByName(name);
      return obj?.object3D;
    },
    traverse(callback: (object: THREE.Object3D) => void) {
      scene.traverse((child) => callback(child.object3D));
    },
  };
}
