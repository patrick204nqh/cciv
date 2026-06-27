import * as THREE from 'three';
import type { SceneEntity } from './types';
import type { StateStore } from '../state/store';
import type { ModelLoader } from '../loaders/types';
import type { InstanceDef } from '../state/types';

function isClaimed(id: string): boolean {
  return id === 'ship';
}

export function createInstanceManager(
  modelLoader: ModelLoader,
  scene: THREE.Scene,
  store: StateStore,
): SceneEntity {
  const instances = new Map<string, { root: THREE.Group; ref: string }>();
  let unsub: (() => void) | null = null;

  function sync(next: Record<string, InstanceDef>) {
    const nextIds = new Set(Object.keys(next).filter(id => !isClaimed(id)));

    for (const [id, entry] of instances) {
      if (!nextIds.has(id)) {
        scene.remove(entry.root);
        instances.delete(id);
      }
    }

    for (const [id, def] of Object.entries(next)) {
      if (isClaimed(id)) continue;
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

    onAttach() {
      const initial = store.get('instances') as Record<string, InstanceDef>;
      sync(initial);
      unsub = store.subscribe('instances', (v) => {
        sync(v as Record<string, InstanceDef>);
      });
    },

    onDetach() {
      unsub?.();
      for (const [, entry] of instances) {
        scene.remove(entry.root);
      }
      instances.clear();
    },
  };
}