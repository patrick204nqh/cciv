import { entityManager } from '../../entity/manager';
import { createEnvironmentEntity } from '../../entity/environment';
import { setWaveConfig } from '../../environment/wave-surface';
import { computeWaves } from '../../environment/wave-config';
import { computeEffectiveEnvironment } from '../../state/environment-utils';
import type { ScenePlugin, PluginContext } from '../types';
import type { EnvironmentState, WeatherType } from '../../state/types';
import type { FogSpec } from '../../scene/types';

let _scene: import('../../scene/types').IScene | null = null;

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
    if (e.id === 'environment' || e.id === 'rain' || e.id === 'mist') entityManager.detach(e);
  }

  const effective = computeEffectiveEnvironment(env);
  const waves = computeWaves(effective.waves);
  setWaveConfig(waves);

  s.fog = effective.fog;
  s.background = effective.sky?.gradientTop ?? s.background;

  entityManager.attach(createEnvironmentEntity(env), s);
}

function getActiveEnvironment(ctx: PluginContext): EnvironmentState {
  const loc = ctx.state.get('activeLocation') as string;
  const envs = ctx.state.get('locations') as Record<string, { environment: EnvironmentState }>;
  return envs[loc]?.environment;
}

/** Apply the current environment state immediately (used by environment editor). */
export function applyEnvironment(ctx: PluginContext): void {
  const env = getActiveEnvironment(ctx);
  if (env) rebuildEnvironment(env);
}

export const environmentControllerPlugin: ScenePlugin = {
  id: 'environment-controller',
  label: 'Environment Controller',
  modes: new Set(['edit', 'play']),
  priority: 100,

  init(ctx: PluginContext) {
    const initEnv = getActiveEnvironment(ctx);
    if (initEnv) {
      const initEffective = computeEffectiveEnvironment(initEnv);
      if (_scene) {
        _scene.fog = initEffective.fog;
        if (initEffective.sky) {
          _scene.background = initEffective.sky.gradientTop;
        }
      }
    }

    let _lastLocation = ctx.state.get('activeLocation') as string;
    let _lastWeather: WeatherType = initEnv?.weather ?? 'clear';

    ctx.state.watch(s => ({
      loc: s.activeLocation,
      weather: s.locations[s.activeLocation]?.environment.weather ?? 'clear',
    }), ({ loc, weather }) => {
      if (loc !== _lastLocation) {
        _lastLocation = loc;
        _lastWeather = weather;
        _transition = null;
        const env = getActiveEnvironment(ctx);
        if (env) rebuildEnvironment(env);
        return;
      }

      if (weather === _lastWeather) return;
      _lastWeather = weather;

      const env = getActiveEnvironment(ctx);
      if (!env) return;
      const toEnv = { ...env, weather };
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
