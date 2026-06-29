import type { AppState } from './types';
import { LOCATION_PRESETS } from './worlds';

function addWeatherToLocation(env: EnvironmentState): EnvironmentState {
  return { ...structuredClone(env), weather: 'clear' };
}

export function createDefaultState(): AppState {
  return {
    activeLocation: 'north-sea',
    dirtyLocations: [],
    time: { speed: 1, paused: false, elapsed: 0 },
    instances: structuredClone(LOCATION_PRESETS['north-sea'].instances),
    locations: Object.fromEntries(
      Object.entries(LOCATION_PRESETS).map(([id, preset]) => [
        id,
        { environment: addWeatherToLocation(preset.environment), instances: structuredClone(preset.instances) },
      ]),
    ),
  };
}