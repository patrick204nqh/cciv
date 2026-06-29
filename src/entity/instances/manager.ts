import type { SceneEntity } from '../types';
import type { IScene } from '../../graphics/types';
import type { Disposer } from '../../util/disposer';
import type { StateStore } from '../../state/store';
import type { ModelLoader } from '../../model/types';
import type { InstanceDef } from '../../state/types';
import type { ModelEntity } from '../../model/types';
import { EntityStateBinding } from '../../state/binding';

export function createInstanceManager(
  modelLoader: ModelLoader,
  scene: IScene,
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
        const r = e.root;
        r.position = { x: tf.position[0], y: tf.position[1], z: tf.position[2] };
        r.rotation = { x: tf.rotation[0], y: tf.rotation[1], z: tf.rotation[2] };
        r.scale = { x: tf.scale, y: tf.scale, z: tf.scale };
        r.visible = def.visible;
      } else {
        const model = modelLoader.getCached(def.ref);
        if (!model) continue;
        const e = model.clone();
        const tf = def.transform;
        const r = e.root;
        r.position = { x: tf.position[0], y: tf.position[1], z: tf.position[2] };
        r.rotation = { x: tf.rotation[0], y: tf.rotation[1], z: tf.rotation[2] };
        r.scale = { x: tf.scale, y: tf.scale, z: tf.scale };
        r.visible = def.visible;
        scene.add(r);
        instances.set(id, { entity: e });
      }
    }
  }

  return {
    id: 'instance-manager',

    onAttach(_scene, disposer?: Disposer) {
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
        scene.remove(entry.entity.root);
      }
      instances.clear();
    },
  };
}
