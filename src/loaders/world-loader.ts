import type { WorldLoadResult, WorldLoadError } from '../worlds/types';
import type { WorldConfig } from '../state/types';
import type { ModelLoader } from './types';
import type { StateStore } from '../state/store';
import { EntityFactory } from '../entity/entity-factory';

export class WorldLoader {
  private factory = new EntityFactory();

  async load(
    config: WorldConfig,
    modelLoader: ModelLoader,
    store?: StateStore,
  ): Promise<WorldLoadResult> {
    const entities: import('../entity/types').SceneEntity[] = [];
    const errors: WorldLoadError[] = [];

    const envEntities = await this.factory.createEnvironmentEntities(config, store);
    entities.push(...envEntities);

    const instanceResult = await this.factory.createInstanceEntities(config, modelLoader);
    entities.push(...instanceResult.entities);
    errors.push(...instanceResult.errors);

    return {
      entities,
      errors,
      metadata: { loadedAt: Date.now() },
    };
  }
}
