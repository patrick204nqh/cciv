import { computeWaves } from '../../environment/wave-config';
import { setWaveConfig } from '../../environment/wave-surface';
import { computeEffectiveEnvironment } from '../../state/environment-utils';
import { createOceanEntity } from './ocean';
import { createSkyEntity } from './sky';
import { createLightingEntity } from './lighting';
import { createRainEntity } from './rain';
import { createMistEntity } from './mist';
import { createTerrainEntity } from './terrain';
import { entityRegistry } from '../entity-registry';
import type { SceneEntity } from '../types';
import type { Disposer } from '../../util/disposer';
import type { ModelLoader } from '../../model/types';
import type { EnvironmentState, WorldConfig } from '../../state/types';
import type { ISkyConfig, IScene } from '../../graphics/types';

entityRegistry.register({
  async match(config: WorldConfig, _modelLoader: ModelLoader) {
    if (!config.environment.ocean) return { entities: [], errors: [] };
    return { entities: [createEnvironmentEntity(config.environment)], errors: [] };
  },
});

entityRegistry.register({
  async match(config: WorldConfig, _modelLoader: ModelLoader) {
    if (!config.environment.terrain) return { entities: [], errors: [] };
    return { entities: [createTerrainEntity(config.environment.terrain)], errors: [] };
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
        const e = createOceanEntity(effective.ocean.extent, effective.ocean.gridSize, {
          color: effective.ocean.color,
        });
        e.onAttach(scene, disposer);
        subEntities.push(e);
      }
      if (effective.sky) {
        const e = createSkyEntity(skyConfigFromEnv(effective));
        e.onAttach(scene, disposer);
        subEntities.push(e);
      }
      if (effective.lighting) {
        const e = createLightingEntity(effective.lighting);
        e.onAttach(scene, disposer);
        subEntities.push(e);
      }
      if (effective.weather === 'fog' || effective.weather === 'storm') {
        const e = createMistEntity();
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

function skyConfigFromEnv(env: ReturnType<typeof computeEffectiveEnvironment>): ISkyConfig {
  const sunAz = env.lighting?.sun?.azimuth ?? 0.8;
  const sunEl = env.lighting?.sun?.elevation ?? 1.2;
  const sunPosition: [number, number, number] = [
    Math.cos(sunEl) * Math.sin(sunAz),
    Math.sin(sunEl),
    -Math.cos(sunEl) * Math.cos(sunAz),
  ];

  const weather = env.weather ?? 'clear';
  const isStorm = weather === 'storm';
  const isFog = weather === 'fog';
  const isCloudy = weather === 'cloudy';

  return {
    sunPosition,
    turbidity: isStorm ? 10 : isFog ? 8 : isCloudy ? 5 : 2,
    rayleigh: isStorm ? 3 : isFog ? 2 : 1,
    mieCoefficient: isStorm ? 0.01 : 0.005,
    mieDirectionalG: 0.8,
    showSunDisc: !isStorm && !isFog,
    cloudCoverage: isStorm ? 0.9 : isFog ? 0.3 : isCloudy ? 0.7 : 0.2,
    cloudDensity: isStorm ? 0.8 : isFog ? 0.2 : isCloudy ? 0.5 : 0.3,
    cloudSpeed: 0.0001,
    cloudScale: 0.0002,
  };
}
