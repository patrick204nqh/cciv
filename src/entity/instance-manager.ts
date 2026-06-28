import * as THREE from 'three';
import type { SceneEntity } from './types';
import type { Disposer } from '../util/disposer';
import type { StateStore } from '../state/store';
import type { ModelLoader } from '../loaders/types';
import type { InstanceDef } from '../state/types';
import { EntityStateBinding } from '../state/binding';

export function createInstanceManager(
  modelLoader: ModelLoader,
  scene: THREE.Scene,
  store: StateStore,
): SceneEntity {
  const instances = new Map<string, { root: THREE.Group; ref: string }>();

  function sync(next: Record<string, InstanceDef>) {
    const nextIds = new Set(
      Object.keys(next).filter(id => (next[id].behavior ?? 'static') !== 'vessel')
    );

    for (const [id, entry] of instances) {
      if (!nextIds.has(id)) {
        scene.remove(entry.root);
        instances.delete(id);
      }
    }

    for (const [id, def] of Object.entries(next)) {
      if ((def.behavior ?? 'static') === 'vessel') continue;
      const existing = instances.get(id);
      if (existing) {
        const tf = def.transform;
        existing.root.position.set(tf.position[0], tf.position[1], tf.position[2]);
        existing.root.rotation.set(tf.rotation[0], tf.rotation[1], tf.rotation[2]);
        existing.root.scale.setScalar(tf.scale);
        existing.root.visible = def.visible;
      } else {
        const model = modelLoader.getCached(def.ref);
        if (!model) continue;
        const root = model.root.clone();
        const tf = def.transform;
        root.position.set(tf.position[0], tf.position[1], tf.position[2]);
        root.rotation.set(tf.rotation[0], tf.rotation[1], tf.rotation[2]);
        root.scale.setScalar(tf.scale);
        root.visible = def.visible;
        scene.add(root);
        instances.set(id, { root, ref: def.ref });
      }
    }
  }

  return {
    id: 'instance-manager',

    onAttach(_scene: THREE.Scene, disposer?: Disposer) {
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
