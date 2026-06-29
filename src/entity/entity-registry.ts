import type { SceneEntity } from './types';
import type { WorldConfig } from '../state/types';
import type { ModelLoader, WorldLoadError } from '../model/types';
import type { StateStore } from '../state/store';

export interface EntityFactory {
  match(
    config: WorldConfig,
    modelLoader: ModelLoader,
    store?: StateStore,
  ): Promise<FactoryResult>;
}

export interface FactoryResult {
  entities: SceneEntity[];
  errors: WorldLoadError[];
}

export class EntityRegistry {
  private factories: EntityFactory[] = [];

  register(factory: EntityFactory): void {
    this.factories.push(factory);
  }

  async createAll(
    config: WorldConfig,
    modelLoader: ModelLoader,
    store?: StateStore,
  ): Promise<FactoryResult> {
    const results = await Promise.all(
      this.factories.map(f => f.match(config, modelLoader, store)),
    );
    return {
      entities: results.flatMap(r => r.entities),
      errors: results.flatMap(r => r.errors),
    };
  }
}

export const entityRegistry = new EntityRegistry();
