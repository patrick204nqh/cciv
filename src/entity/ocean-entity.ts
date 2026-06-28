import * as THREE from 'three';
import type { SceneEntity, SceneHandle } from './types';
import { waveSurface } from '../environment/wave-surface';
import { buildOceanGrid } from '../environment/ocean-grid';
import { displaceOceanGrid } from '../environment/ocean-displacement';
import { createWaterMaterial } from '../rendering/materials';
import type { Disposer } from '../util/disposer';
import type { StateStore } from '../state/store';
import { EntityStateBinding } from '../state/binding';

export function createOceanEntity(store?: StateStore): SceneEntity {
  const seg = 80;
  const size = 1800;

  let ocean: THREE.Mesh;
  let basePos: Float32Array;
  let mat: THREE.MeshStandardMaterial;

  return {
    id: 'ocean',

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      const { geo } = buildOceanGrid(size, seg);
      const pos = geo.attributes.position.array as Float32Array;
      basePos = new Float32Array(pos.length);
      basePos.set(pos);

      mat = createWaterMaterial();

      ocean = new THREE.Mesh(geo, mat);
      ocean.position.y = -0.35;
      ocean.receiveShadow = true;
      scene.add(ocean);

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

    onUpdate(_dt: number) {
      displaceOceanGrid(ocean.geometry as THREE.BufferGeometry, basePos, waveSurface);
    },

    onDetach() {},
  };
}
