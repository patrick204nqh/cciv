import type { SceneEntity } from '../entity/types';

export interface WorldLoadError {
  ref: string;
  error: Error;
}

export interface WorldLoadResult {
  entities: SceneEntity[];
  errors: WorldLoadError[];
  metadata: {
    worldId?: string;
    loadedAt: number;
  };
}
