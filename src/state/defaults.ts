import type { AppState } from './types';
import { LOCATION_PRESETS } from './worlds';

export function createDefaultState(): AppState {
  const preset = LOCATION_PRESETS['north-sea'];
  return {
    activeLocation: 'north-sea',
    dirtyLocations: [],
    time: { speed: 1, paused: false, elapsed: 0 },
    environment: { ...structuredClone(preset.environment), weather: 'clear' },
    instances: structuredClone(preset.instances),
    locations: structuredClone(LOCATION_PRESETS),
  };
}