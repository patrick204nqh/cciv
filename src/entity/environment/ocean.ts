import * as THREE from 'three';
import type { SceneEntity, SceneHandle } from '../types';
import { SceneObject } from '../../scene/object';
import { createTSLOceanMaterial } from '../../environment/tsl-ocean';
import type { Disposer } from '../../util/disposer';
import type { StateStore } from '../../state/store';
import { EntityStateBinding } from '../../state/binding';
import { entityRegistry } from '../entity-registry';
import type { ModelLoader } from '../../loaders/types';
import type { WorldConfig } from '../../state/types';

entityRegistry.register({
  async match(config: WorldConfig, _modelLoader: ModelLoader, store?: StateStore) {
    if (!config.environment.ocean) return { entities: [], errors: [] };
    return { entities: [createOceanEntity(store)], errors: [] };
  },
});

export function createOceanEntity(store?: StateStore): SceneEntity {
  let ocean: THREE.Mesh;

  return {
    id: 'ocean',

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      const seg = 80;
      const size = 1800;

      const geo = new THREE.PlaneGeometry(size, size, seg, seg);
      geo.rotateX(-Math.PI / 2);

      const mat = createTSLOceanMaterial();

      ocean = new THREE.Mesh(geo, mat);
      ocean.position.y = -0.35;
      ocean.receiveShadow = true;
      scene.add(new SceneObject(ocean));

      disposer?.add(geo);
      disposer?.add(mat);
      disposer?.add(ocean);

      if (store && disposer) {
        const binding = new EntityStateBinding(
          store,
          'environment.ocean',
          (cfg: any) => {
            mat.color.set(cfg.color);
            mat.opacity = cfg.opacity;
          }
        );
        binding.attach(disposer);
      }
    },

    onUpdate() {},

    onDetach() {},
  };
}
