import { PlaneGeometry } from 'three';
import type { SceneEntity, SceneHandle } from '../types';
import { createTSLOceanMaterial } from '../../environment/tsl-ocean';
import type { Disposer } from '../../util/disposer';
import { createBasicMaterial } from '../../scene/scene-adapter';
import { entityRegistry } from '../entity-registry';
import type { ModelLoader } from '../../loaders/types';
import type { WorldConfig } from '../../state/types';

entityRegistry.register({
  async match(config: WorldConfig, _modelLoader: ModelLoader) {
    if (!config.environment.ocean) return { entities: [], errors: [] };
    return { entities: [createOceanEntity()], errors: [] };
  },
});

export function createOceanEntity(): SceneEntity {
  let ocean: any;

  return {
    id: 'ocean',

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      const s = scene as any;
      const size = 1800;
      const seg = 80;

      const geo = new PlaneGeometry(size, size, seg, seg);
      geo.rotateX(-Math.PI / 2);

      const mat = createTSLOceanMaterial();
      ocean = s.createMesh(geo, { _vendor: mat, dispose: () => mat.dispose() });
      s.add(ocean);

      if (disposer) disposer.add(() => ocean.dispose());
    },

    onUpdate() {},
    onDetach() {},
  };
}
