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

function getWeatherPath(): string {
  const loc = _ctx!.state.get('activeLocation') as string;
  return `locations.${loc}.environment.weather`;
}

export function initLocationCtx(ctx: PluginContext) {
  _ctx = ctx;
  const loc = ctx.state.get('activeLocation') as string;
  const envs = ctx.state.get('locations') as Record<string, { environment: { weather?: WeatherType } }>;
  const weather = envs[loc]?.environment?.weather ?? 'clear';
  useLocationStore.getState().updateActive(loc);
  useLocationStore.getState().setWeather(weather);
}

export function setWeather(weather: WeatherType) {
  if (!_ctx) return;
  _ctx.state.set(getWeatherPath(), weather);
  useLocationStore.setState({ weather });
}

export function switchLocation(locationId: string) {
  const { transitioning, activeLocation } = useLocationStore.getState();
  if (transitioning || !_ctx || locationId === activeLocation) return;
  const preset = LOCATION_PRESETS[locationId];
  if (!preset) return;

  useLocationStore.setState({ transitioning: true });

  _ctx.state.set('activeLocation', locationId);
  _ctx.state.set('instances', structuredClone(preset.instances));

  const weather = (_ctx.state.get(`locations.${locationId}.environment.weather`) as WeatherType) ?? 'clear';
  useLocationStore.setState({ transitioning: false, activeLocation: locationId, weather });
}
