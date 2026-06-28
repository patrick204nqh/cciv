import type { SceneEntity } from '../entity/types';
import type { ModelLoader } from '../loaders/types';
import type { WorldConfig } from '../state/types';
import { createVesselEntity } from '../entity/ship-entity';
import { createOceanEntity } from '../entity/ocean-entity';
import { createSkyEntity } from '../entity/sky-entity';
import { createLightingEntity } from '../entity/lighting-entity';
import { createSprayEntity } from '../entity/spray-entity';
import { createWakeEntity } from '../entity/wake-entity';

export interface EntityFactoryResult {
  entities: SceneEntity[];
  errors: Array<{ ref: string; error: Error }>;
}

export class EntityFactory {
  async createEnvironmentEntities(config: WorldConfig): Promise<SceneEntity[]> {
    const entities: SceneEntity[] = [];

    if (config.environment.ocean) {
      entities.push(createOceanEntity());
    }

    if (config.environment.sky) {
      entities.push(createSkyEntity());
    }

    if (config.environment.lighting) {
      entities.push(createLightingEntity());
    }

    return entities;
  }

  async createInstanceEntities(
    config: WorldConfig,
    modelLoader: ModelLoader,
  ): Promise<EntityFactoryResult> {
    const entities: SceneEntity[] = [];
    const errors: Array<{ ref: string; error: Error }> = [];

    for (const [id, def] of Object.entries(config.instances)) {
      if (def.behavior === 'vessel') {
        try {
          const model = await modelLoader.load(def.ref);
          entities.push(createVesselEntity(model, id));
          entities.push(createSprayEntity(id));
          entities.push(createWakeEntity(id));
        } catch (e) {
          errors.push({ ref: def.ref, error: e instanceof Error ? e : new Error(String(e)) });
        }
      }
    }

    return { entities, errors };
  }
}
