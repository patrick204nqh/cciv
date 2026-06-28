import type { IScene, ISceneObject } from '../scene/types';

export interface PluginSceneAPI {
  add(object: ISceneObject): void;
  remove(object: ISceneObject): void;
  getObjectByName(name: string): ISceneObject | undefined;
  traverse(callback: (object: ISceneObject) => void): void;
}

export function createPluginSceneAPI(scene: IScene): PluginSceneAPI {
  return {
    add(object: ISceneObject) {
      scene.add(object);
    },
    remove(object: ISceneObject) {
      scene.remove(object);
    },
    getObjectByName(name: string) {
      return scene.getObjectByName(name);
    },
    traverse(callback: (object: ISceneObject) => void) {
      scene.traverse(callback);
    },
  };
}
