import { PlaneGeometry } from 'three';
import type { SceneEntity, SceneHandle } from '../types';
import type { IScene } from '../../scene/types';
import { createTSLOceanMaterial } from '../../environment/tsl-ocean';
import { computeWaves, type ComputedWave } from '../../environment/wave-config';
import { setWaveConfig } from '../../environment/wave-surface';
import type { Disposer } from '../../util/disposer';
import { entityRegistry } from '../entity-registry';
import type { ModelLoader } from '../../loaders/types';
import type { WorldConfig } from '../../state/types';

entityRegistry.register({
  async match(config: WorldConfig, _modelLoader: ModelLoader) {
    if (!config.environment.ocean) return { entities: [], errors: [] };
    const waves = computeWaves(config.environment.waves);
    const { extent = 1800, gridSize = 80 } = config.environment.ocean;
    return { entities: [createOceanEntity(waves, extent, gridSize)], errors: [] };
  },
});

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

      setWaveConfig(waves);

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
