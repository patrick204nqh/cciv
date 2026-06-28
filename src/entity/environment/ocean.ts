import * as THREE from 'three';
import type { SceneEntity, SceneHandle } from '../types';
import type { IMaterial } from '../../scene/types';
import { SceneObject } from '../../scene/object';
import { buildOceanGrid } from '../../environment/ocean-grid';
import { createTSLOceanMaterial } from '../../environment/tsl-ocean';
import type { Disposer } from '../../util/disposer';
import type { StateStore } from '../../state/store';
import { EntityStateBinding } from '../../state/binding';

export function createOceanEntity(store?: StateStore): SceneEntity {
  const seg = 80;
  const size = 1800;

  let ocean: THREE.Mesh;

  return {
    id: 'ocean',

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      const { geo } = buildOceanGrid(size, seg);

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
