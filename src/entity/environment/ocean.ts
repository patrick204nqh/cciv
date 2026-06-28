import { PlaneGeometry } from 'three';
import type { SceneEntity, SceneHandle } from '../types';
import type { IScene } from '../../scene/types';
import { createTSLOceanMaterial } from '../../environment/tsl-ocean';
import type { ComputedWave } from '../../environment/wave-config';
import type { Disposer } from '../../util/disposer';

export function createOceanEntity(
  waves: ComputedWave[],
  extent = 1800,
  gridSize = 80,
): SceneEntity {
  let mesh: import('../../scene/types').ISceneObject | null = null;

  return {
    id: 'ocean',

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      const s = scene as IScene;

      const geo = new PlaneGeometry(extent, extent, gridSize, gridSize);
      geo.rotateX(-Math.PI / 2);

      const mat = createTSLOceanMaterial(waves);
      const material: import('../../scene/types').IMaterial = {
        dispose: () => mat.dispose(),
      };
      (material as any)._vendor = mat;
      mesh = s.createMesh(geo, material);
      s.add(mesh);

      if (disposer) disposer.add(() => mesh!.dispose());
    },

    onUpdate() {},
    onDetach() {
      mesh = null;
    },
  };
}
