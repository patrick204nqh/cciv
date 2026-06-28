import type { WorldLoadResult } from './types';
import type { WorldConfig } from '../state/types';
import type { ModelLoader } from './types';
import type { StateStore } from '../state/store';
import { entityRegistry } from '../entity/entity-registry';
import '../entity/register-factories';

export class WorldLoader {
  async load(
    config: WorldConfig,
    modelLoader: ModelLoader,
    store?: StateStore,
  ): Promise<WorldLoadResult> {
    const result = await entityRegistry.createAll(config, modelLoader, store);

    return {
      entities: result.entities,
      errors: result.errors,
      metadata: { loadedAt: Date.now() },
    };
  }
}
