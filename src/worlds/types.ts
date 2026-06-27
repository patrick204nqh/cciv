export interface ModelInstance {
  ref: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  quaternion?: [number, number, number, number];
  scale?: number;
}

/** @deprecated Use LocationPreset from state/types instead */
export interface EnvironmentConfig {
  ocean?: boolean;
  sky?: boolean;
  lighting?: 'day' | 'night' | 'sunset';
}

/** @deprecated Use LocationPreset from state/types instead */
export interface WorldConfig {
  id: string;
  models: ModelInstance[];
  environment: EnvironmentConfig;
}

import type { ModelEntity } from '../model/types';

export interface WorldLoadResult {
  config: WorldConfig;
  entries: Array<{ model: ModelEntity; instance: ModelInstance }>;
}
