import { computeEffectiveEnvironment } from '../../state/environment-utils';
import type { ScenePlugin, PluginContext } from '../types';
import type { EnvironmentState, WeatherType } from '../../state/types';
import type { FogSpec } from '../../graphics/types';
import type { WorldController } from '../../controller/world-controller';

let _worldController: WorldController | null = null;
let _scene: import('../../graphics/types').IScene | null = null;

export function initEnvController(wc: WorldController): void {
  _worldController = wc;
}

interface TransitionState {
  fromFog: FogSpec
  toFog: FogSpec
  fromBg: string
  toBg: string
  elapsed: number
  duration: number
  toEnv: EnvironmentState
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

function getActiveEnvironment(ctx: PluginContext): EnvironmentState {
  const loc = ctx.state.get('activeLocation') as string;
  const envs = ctx.state.get('locations') as Record<string, { environment: EnvironmentState }>;
  return envs[loc]?.environment;
}

export function applyEnvironment(ctx: PluginContext): void {
  _worldController?.commit();
}

export const environmentControllerPlugin: ScenePlugin = {
  id: 'environment-controller',
  label: 'Environment Controller',
  modes: new Set(['edit', 'play']),
  priority: 100,

  init(ctx: PluginContext) {
    _scene = ctx.scene;
    const initEnv = getActiveEnvironment(ctx);
    if (initEnv) {
      const initEffective = computeEffectiveEnvironment(initEnv);
      ctx.scene.fog = initEffective.fog;
      if (initEffective.sky) {
        ctx.scene.background = initEffective.sky.gradientTop;
      }
    }

    let _lastLocation = ctx.state.get('activeLocation') as string;
    let _lastWeather: WeatherType = initEnv?.weather ?? 'clear';

    ctx.state.watch((s: any) => ({
      loc: s.activeLocation,
      weather: s.locations[s.activeLocation]?.environment.weather ?? 'clear',
    }), ({ loc, weather }: { loc: string; weather: WeatherType }) => {
      if (loc !== _lastLocation) {
        _lastLocation = loc;
        _lastWeather = weather;
        _transition = null;
        _worldController?.commit();
        return;
      }

      if (weather === _lastWeather) return;
      _lastWeather = weather;

      const env = getActiveEnvironment(ctx);
      if (!env) return;
      const toEnv: EnvironmentState = { ...env, weather };
      const toEffective = computeEffectiveEnvironment(toEnv);
      const fromFog = ctx.scene.fog ?? toEffective.fog;
      const fromBg = ctx.scene.background ?? toEffective.sky?.gradientTop ?? '#406888';
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
      density: fromFog.density !== undefined && toFog.density !== undefined
        ? fromFog.density + (toFog.density - fromFog.density) * t
        : fromFog.density,
    };

    _scene.background = lerpColor(fromBg, toBg, t);

    if (t >= 1) {
      _transition = null;
      _worldController?.commit();
    }
  },

  destroy() {
    _worldController = null;
  },
};
