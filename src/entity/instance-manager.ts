import * as THREE from 'three';
import type { SceneEntity, SceneHandle } from './types';
import type { Disposer } from '../util/disposer';
import type { StateStore } from '../state/store';
import type { ModelLoader } from '../loaders/types';
import type { InstanceDef } from '../state/types';
import type { ModelEntity } from '../model/types';
import { EntityStateBinding } from '../state/binding';

export function createInstanceManager(
  modelLoader: ModelLoader,
  scene: THREE.Scene,
  store: StateStore,
): SceneEntity {
  const instances = new Map<string, { entity: ModelEntity }>();

  function sync(next: Record<string, InstanceDef>) {
    const nextIds = new Set(
      Object.keys(next).filter(id => (next[id].behavior ?? 'static') !== 'vessel')
    );

    for (const [id, entry] of instances) {
      if (!nextIds.has(id)) {
        scene.remove(entry.entity.root);
        instances.delete(id);
      }
    }

    for (const [id, def] of Object.entries(next)) {
      if ((def.behavior ?? 'static') === 'vessel') continue;
      const existing = instances.get(id);
      if (existing) {
        const e = existing.entity;
        const tf = def.transform;
        e.setPosition(tf.position[0], tf.position[1], tf.position[2]);
        e.setRotation(tf.rotation[0], tf.rotation[1], tf.rotation[2]);
        e.setScale(tf.scale);
        e.setVisible(def.visible);
        if (def.materials) e.applyMaterials(def.materials);
      } else {
        const model = modelLoader.getCached(def.ref);
        if (!model) continue;
        const e = model.clone();
        const tf = def.transform;
        e.setPosition(tf.position[0], tf.position[1], tf.position[2]);
        e.setRotation(tf.rotation[0], tf.rotation[1], tf.rotation[2]);
        e.setScale(tf.scale);
        e.setVisible(def.visible);
        if (def.materials) e.applyMaterials(def.materials);
        scene.add(e.root);
        instances.set(id, { entity: e });
      }
    }
  }

  return {
    id: 'instance-manager',

    onAttach(_scene: SceneHandle, disposer?: Disposer) {
      const initial = store.get('instances') as Record<string, InstanceDef>;
      sync(initial);
      
      if (disposer) {
        const binding = new EntityStateBinding(
          store,
          'instances',
          (v) => sync(v as Record<string, InstanceDef>)
        );
        binding.attach(disposer);
      }
    },

    onDetach() {
      for (const [, entry] of instances) {
        scene.remove(entry.root);
      }
      instances.clear();
    },
  };
}
