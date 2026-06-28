import { entityManager } from '../../entity/manager';
import { createOceanEntity } from '../../entity/environment/ocean';
import { createSkyEntity } from '../../entity/environment/sky';
import { createLightingEntity } from '../../entity/environment/lighting';
import { setWaveConfig } from '../../environment/wave-surface';
import { computeWaves } from '../../environment/wave-config';
import { computeEffectiveEnvironment } from '../../state/environment-utils';
import type { ScenePlugin, PluginContext } from '../types';
import type { IScene } from '../../scene/types';
import type { EnvironmentState, WeatherType } from '../../state/types';

const ENV_IDS = new Set(['ocean', 'sky', 'lighting']);

let _scene: IScene | null = null;
let _currentWeather: WeatherType = 'clear';

export function initEnvController(scene: IScene): void {
  _scene = scene;
}

function rebuildEnvironment(env: EnvironmentState): void {
  const s = _scene;
  if (!s) return;

  const current = entityManager.getEntities();
  for (const e of current) {
    if (ENV_IDS.has(e.id)) entityManager.detach(e);
  }

  const effective = computeEffectiveEnvironment(env);
  const waves = computeWaves(effective.waves);
  setWaveConfig(waves);

  if (effective.ocean) {
    entityManager.attach(createOceanEntity(waves, effective.ocean.extent, effective.ocean.gridSize), s);
  }
  if (effective.sky) {
    entityManager.attach(createSkyEntity(effective.sky), s);
  }
  if (effective.lighting) {
    entityManager.attach(createLightingEntity(effective.lighting), s);
  }
}

export const environmentControllerPlugin: ScenePlugin = {
  id: 'environment-controller',
  label: 'Environment Controller',
  modes: new Set(['edit', 'play']),
  priority: 100,

  init(ctx: PluginContext) {
    _currentWeather = (ctx.state.get('environment.weather') as WeatherType) ?? 'clear';

    ctx.state.watch(s => s.environment.weather, (w) => {
      if (w === _currentWeather) return;
      _currentWeather = w ?? 'clear';
      const env = ctx.state.get('environment') as EnvironmentState;
      rebuildEnvironment(env);
    });

    ctx.state.watch(s => s.activeLocation, () => {
      const env = ctx.state.get('environment') as EnvironmentState;
      const merged = { ...env, weather: _currentWeather };
      rebuildEnvironment(merged);
    });
  },

  destroy() {},
};
