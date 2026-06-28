import { computeWaves } from '../../environment/wave-config';
import { setWaveConfig } from '../../environment/wave-surface';
import { computeEffectiveEnvironment } from '../../state/environment-utils';
import { createOceanEntity } from './ocean';
import { createSkyEntity } from './sky';
import { createLightingEntity } from './lighting';
import { createRainEntity } from './rain';
import { entityRegistry } from '../entity-registry';
import type { SceneEntity } from '../types';
import type { Disposer } from '../../util/disposer';
import type { ModelLoader } from '../../loaders/types';
import type { EnvironmentState, WorldConfig } from '../../state/types';

entityRegistry.register({
  async match(config: WorldConfig, _modelLoader: ModelLoader) {
    if (!config.environment.ocean) return { entities: [], errors: [] };
    return { entities: [createEnvironmentEntity(config.environment)], errors: [] };
  },
});

export function createEnvironmentEntity(env: EnvironmentState): SceneEntity {
  const effective = computeEffectiveEnvironment(env);
  const waves = computeWaves(effective.waves);
  let subEntities: SceneEntity[] = [];

  return {
    id: 'environment',

    onAttach(scene, disposer?: Disposer) {
      setWaveConfig(waves);
      subEntities = [];

      if (effective.ocean) {
        const e = createOceanEntity(waves, effective.ocean.extent, effective.ocean.gridSize);
        e.onAttach(scene, disposer);
        subEntities.push(e);
      }
      if (effective.sky) {
        const e = createSkyEntity(effective.sky);
        e.onAttach(scene, disposer);
        subEntities.push(e);
      }
      if (effective.lighting) {
        const e = createLightingEntity(effective.lighting);
        e.onAttach(scene, disposer);
        subEntities.push(e);
      }
      if (effective.weather === 'storm') {
        const e = createRainEntity();
        e.onAttach(scene, disposer);
        subEntities.push(e);
      }
    },

    onUpdate(dt: number) {
      for (const e of subEntities) {
        e.onUpdate?.(dt);
      }
    },

    onDetach() {
      subEntities = [];
    },
  };
}
