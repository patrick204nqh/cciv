import type { SceneEntity } from '../types';
import { createTSLOceanMaterial } from '../../environment/tsl-ocean';
import type { ComputedWave } from '../../environment/wave-config';
import type { Disposer } from '../../util/disposer';

export function createOceanEntity(
  waves: ComputedWave[],
  extent = 1800,
  gridSize = 80,
): SceneEntity {
  let mesh: import('../../graphics/types').ISceneObject | null = null;

  return {
    id: 'ocean',

    onAttach(scene, disposer?: Disposer) {
      const geo = scene.createPlaneGeometry(extent, extent, gridSize, gridSize);

      const mat = createTSLOceanMaterial(waves);
      const material: import('../../graphics/types').IMaterial = {
        dispose: () => mat.dispose(),
        _vendor: mat,
      };
      mesh = scene.createMesh(geo, material);
      scene.add(mesh);

      if (disposer) disposer.add(() => mesh!.dispose());
    },

    onUpdate() {},
    onDetach() {
      mesh = null;
    },
  };
}
