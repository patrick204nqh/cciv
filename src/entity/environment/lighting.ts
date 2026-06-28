import type { SceneEntity, SceneHandle } from '../types';
import type { Disposer } from '../../util/disposer';
import { entityRegistry } from '../entity-registry';
import type { ModelLoader } from '../../loaders/types';
import type { WorldConfig } from '../../state/types';

entityRegistry.register({
  async match(config: WorldConfig, _modelLoader: ModelLoader) {
    if (!config.environment.lighting) return { entities: [], errors: [] };
    return { entities: [createLightingEntity()], errors: [] };
  },
});

export function createLightingEntity(): SceneEntity {
  return {
    id: 'lighting',

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      const s = scene as any;
      const sun = s.createDirectionalLight('#fff0d0', 2.8);
      sun.position = { x: 90, y: 130, z: -55 };
      s.add(sun);

      const hemi = s.createHemisphereLight('#87ceeb', '#3a6b3a', 0.8);
      hemi.position = { x: 0, y: 100, z: 0 };
      s.add(hemi);

      const ambient = s.createAmbientLight('#404060', 0.6);
      s.add(ambient);

      if (disposer) {
        disposer.add(() => { sun.dispose(); hemi.dispose(); ambient.dispose(); });
      }
    },

    onUpdate() {},
    onDetach() {},
  };
}
