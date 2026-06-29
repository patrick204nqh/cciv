import { entityManager } from '../../entity/manager';
import { createEnvironmentEntity } from '../../entity/environment';
import { setWaveConfig } from '../../environment/wave-surface';
import { computeWaves } from '../../environment/wave-config';
import { computeEffectiveEnvironment } from '../../state/environment-utils';
import type { ScenePlugin, PluginContext } from '../types';
import type { EnvironmentState, WeatherType } from '../../state/types';
import type { FogSpec } from '../../scene/types';

let _scene: import('../../scene/types').IScene | null = null;
let _currentWeather: WeatherType = 'clear';

interface TransitionState {
  fromFog: FogSpec;
  toFog: FogSpec;
  fromBg: string;
  toBg: string;
  elapsed: number;
  duration: number;
  toEnv: EnvironmentState;
}

let _transition: TransitionState | null = null;

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `#${((rr << 16) | (rg << 8) | rb).toString(16).padStart(6, '0')}`;
}

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

  s.fog = effective.fog;
  s.background = effective.sky?.gradientTop ?? s.background;

  entityManager.attach(createEnvironmentEntity(env), s);
}

export const environmentControllerPlugin: ScenePlugin = {
  id: 'environment-controller',
  label: 'Environment Controller',
  modes: new Set(['edit', 'play']),
  priority: 100,

  init(ctx: PluginContext) {
    _currentWeather = (ctx.state.get('environment.weather') as WeatherType) ?? 'clear';

    const initEnv = ctx.state.get('environment') as EnvironmentState;
    const initEffective = computeEffectiveEnvironment(initEnv);
    if (_scene) {
      _scene.fog = initEffective.fog;
      if (initEffective.sky) {
        _scene.background = initEffective.sky.gradientTop;
      }
    }

    ctx.state.watch(s => s.environment.weather, (w) => {
      if (w === _currentWeather) return;
      _currentWeather = w ?? 'clear';

      const baseEnv = ctx.state.get('environment') as EnvironmentState;
      const toEnv = { ...baseEnv, weather: _currentWeather };
      const toEffective = computeEffectiveEnvironment(toEnv);
      const fromFog = _scene?.fog ?? toEffective.fog;
      const fromBg = _scene?.background ?? toEffective.sky?.gradientTop ?? '#406888';
      const toBg = toEffective.sky?.gradientTop ?? fromBg;

      _transition = {
        fromFog,
        toFog: toEffective.fog,
        fromBg,
        toBg,
        elapsed: 0,
        duration: 2,
        toEnv,
      };
    });

    ctx.state.watch(s => s.activeLocation, () => {
      _transition = null;
      const env = ctx.state.get('environment') as EnvironmentState;
      const merged = { ...env, weather: _currentWeather };
      rebuildEnvironment(merged);
    });
  },

  render(dt: number) {
    if (!_transition || !_scene) return;

    _transition.elapsed += dt;
    const t = Math.min(_transition.elapsed / _transition.duration, 1);

    const { fromFog, toFog, fromBg, toBg } = _transition;
    _scene.fog = {
      type: fromFog.type,
      color: lerpColor(fromFog.color, toFog.color, t),
      density: fromFog.density + (toFog.density - fromFog.density) * t,
    };
    _scene.background = lerpColor(fromBg, toBg, t);

    if (t >= 1) {
      rebuildEnvironment(_transition.toEnv);
      _transition = null;
    }
  },

  destroy() {},
};
