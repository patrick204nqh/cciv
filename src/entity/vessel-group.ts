import type { SceneEntity } from './types';
import type { Disposer } from '../util/disposer';

export function createVesselGroup(id: string, ...children: SceneEntity[]): SceneEntity {
  let attached: SceneEntity[] = [];

  return {
    id,

    onAttach(scene, disposer?: Disposer) {
      for (const child of children) {
        try {
          child.onAttach(scene, disposer);
          attached.push(child);
        } catch (e) {
          for (let i = attached.length - 1; i >= 0; i--) {
            attached[i].onDetach();
          }
          attached = [];
          throw e;
        }
      }
    },

    onBeforeUpdate(dt: number) {
      for (const child of children) {
        child.onBeforeUpdate?.(dt);
      }
    },

    onUpdate(dt: number) {
      for (const child of children) {
        child.onUpdate?.(dt);
      }
    },

    onDetach() {
      for (let i = attached.length - 1; i >= 0; i--) {
        attached[i].onDetach();
      }
      attached = [];
    },
  };
}
