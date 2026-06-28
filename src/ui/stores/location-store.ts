import { create } from 'zustand';
import { LOCATION_PRESETS, CCIV_WORLD } from '../../state/worlds';
import type { PluginContext } from '../../plugins/types';
import type { WeatherType } from '../../state/types';

interface LocationState {
  locations: string[]
  activeLocation: string
  weather: WeatherType
  transitioning: boolean
  updateActive: (id: string) => void
  setWeather: (w: WeatherType) => void
}

export const useLocationStore = create<LocationState>((set) => ({
  locations: CCIV_WORLD.locations,
  activeLocation: 'north-sea',
  weather: 'clear',
  transitioning: false,
  updateActive: (id) => set({ activeLocation: id }),
  setWeather: (w) => set({ weather: w }),
}));

let _ctx: PluginContext | null = null;

export function initLocationCtx(ctx: PluginContext) {
  _ctx = ctx;
  useLocationStore.getState().updateActive(ctx.state.get('activeLocation') as string);
  useLocationStore.getState().setWeather((ctx.state.get('environment.weather') as WeatherType) ?? 'clear');
}

export function setWeather(weather: WeatherType) {
  if (!_ctx) return;
  _ctx.state.set('environment.weather', weather);
  useLocationStore.setState({ weather });
}

export function switchLocation(locationId: string) {
  const { transitioning, activeLocation } = useLocationStore.getState();
  if (transitioning || !_ctx || locationId === activeLocation) return;
  const preset = LOCATION_PRESETS[locationId];
  if (!preset) return;

  useLocationStore.setState({ transitioning: true });
  const prevEnv = _ctx.state.get('environment') as unknown as Record<string, unknown>;

  const start = performance.now();
  const duration = 2000;
  function tick() {
    const t = Math.min((performance.now() - start) / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      const currFog = (_ctx!.state.get as (p: string) => unknown)('environment.fog') as Record<string, unknown>;
    if (typeof currFog.density === 'number' && prevEnv.fog && typeof prevEnv.fog === 'object') {
      const prevDensity = (prevEnv.fog as Record<string, unknown>).density as number;
      const nextDensity = preset.environment.fog.density;
      _ctx!.state.set('environment.fog.density', prevDensity + (nextDensity - prevDensity) * ease);
    }

    if (t >= 1) {
      _ctx!.state.set('environment', preset.environment as unknown as Record<string, unknown>);
      _ctx!.state.set('instances', preset.instances as unknown as Record<string, unknown>);
      _ctx!.state.set('activeLocation', locationId);
      useLocationStore.setState({ transitioning: false, activeLocation: locationId });
    } else {
      requestAnimationFrame(tick);
    }
  }
  tick();
}
