export interface ModelInstance {
  ref: string;
  at: [number, number, number];
  rotation?: [number, number, number];
  quaternion?: [number, number, number, number];
  scale?: number;
}

export interface EnvironmentConfig {
  ocean?: boolean;
  sky?: boolean;
  lighting?: 'day' | 'night' | 'sunset';
}

export interface WorldConfig {
  id: string;
  models: ModelInstance[];
  environment: EnvironmentConfig;
}

export interface WorldDef {
  id: string
  label: string
  locations: string[]
}

export interface WorldCollection {
  current: string
  worlds: Record<string, WorldDef>
}

import type { ModelEntity } from '../model/types';

export interface WorldLoadResult {
  config: WorldConfig;
  entries: Array<{ model: ModelEntity; instance: ModelInstance }>;
}
