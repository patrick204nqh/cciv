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

export interface WorldLoadResult {
  config: WorldConfig;
  entities: import('../entity/types').SceneEntity[];
}
