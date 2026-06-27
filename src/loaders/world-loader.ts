import type { WorldLoadResult, WorldLoadError } from '../worlds/types';
import type { WorldConfig } from '../state/types';
import type { ModelLoader } from './types';
import { createVesselEntity } from '../entity/ship-entity';
import { createOceanEntity } from '../entity/ocean-entity';
import { createSkyEntity } from '../entity/sky-entity';
import { createLightingEntity } from '../entity/lighting-entity';
import { createSprayEntity } from '../entity/spray-entity';
import { createWakeEntity } from '../entity/wake-entity';

export class WorldLoader {
  async load(
    config: WorldConfig,
    modelLoader: ModelLoader,
  ): Promise<WorldLoadResult> {
    const entities: import('../entity/types').SceneEntity[] = [];
    const errors: WorldLoadError[] = [];

    if (config.environment.ocean) {
      entities.push(createOceanEntity());
    }

    if (config.environment.sky) {
      entities.push(createSkyEntity());
    }

    if (config.environment.lighting) {
      entities.push(createLightingEntity());
    }

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
