import * as THREE from 'three';

export interface PluginSceneAPI {
  add(object: THREE.Object3D): void;
  remove(object: THREE.Object3D): void;
  getObjectByName(name: string): THREE.Object3D | undefined;
  traverse(callback: (object: THREE.Object3D) => void): void;
}

export function createPluginSceneAPI(scene: THREE.Scene): PluginSceneAPI {
  return {
    add(object: THREE.Object3D) {
      scene.add(object);
    },
    remove(object: THREE.Object3D) {
      scene.remove(object);
    },
    getObjectByName(name: string) {
      return scene.getObjectByName(name);
    },
    traverse(callback: (object: THREE.Object3D) => void) {
      scene.traverse(callback);
    },
  };
}
