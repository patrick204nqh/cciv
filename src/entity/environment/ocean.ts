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

      const vendorMat = createTSLOceanMaterial(waves);
      const material: import('../../graphics/types').IMaterial = {
        color: '#a0c8e0',
        roughness: 0.3,
        metalness: 0,
        opacity: 1,
        transparent: false,
        side: 0,
        dispose: () => vendorMat.dispose(),
      };
      scene.registerMaterial(material, vendorMat);
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
