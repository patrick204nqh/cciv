import { entityManager } from '../../entity/manager';
import { createEnvironmentEntity } from '../../entity/environment';
import { setWaveConfig } from '../../environment/wave-surface';
import { computeWaves } from '../../environment/wave-config';
import { computeEffectiveEnvironment } from '../../state/environment-utils';
import type { ScenePlugin, PluginContext } from '../types';
import type { EnvironmentState, WeatherType } from '../../state/types';

let _scene: import('../../scene/types').IScene | null = null;
let _currentWeather: WeatherType = 'clear';

export function initEnvController(scene: import('../../scene/types').IScene): void {
  _scene = scene;
}

function rebuildEnvironment(env: EnvironmentState): void {
  const s = _scene;
  if (!s) return;

  const current = entityManager.getEntities();
  for (const e of current) {
    if (e.id === 'environment' || e.id === 'rain') entityManager.detach(e);
  }

  const effective = computeEffectiveEnvironment(env);
  const waves = computeWaves(effective.waves);
  setWaveConfig(waves);

  entityManager.attach(createEnvironmentEntity(env), s);
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
