import type { WorldLoadResult, WorldLoadError } from '../worlds/types';
import type { WorldConfig } from '../state/types';
import type { ModelLoader } from './types';
import { EntityFactory } from '../entity/entity-factory';

export class WorldLoader {
  private factory = new EntityFactory();

  async load(
    config: WorldConfig,
    modelLoader: ModelLoader,
  ): Promise<WorldLoadResult> {
    const entities: import('../entity/types').SceneEntity[] = [];
    const errors: WorldLoadError[] = [];

    const envEntities = await this.factory.createEnvironmentEntities(config);
    entities.push(...envEntities);

    const instanceResult = await this.factory.createInstanceEntities(config, modelLoader);
    entities.push(...instanceResult.entities);
    errors.push(...instanceResult.errors);

    return {
      entities,
      errors,
      metadata: {
        worldId: 'id' in config ? (config as any).id : undefined,
        loadedAt: Date.now(),
      },
    };
  }
}
