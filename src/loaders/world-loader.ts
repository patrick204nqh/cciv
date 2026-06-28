import type { WorldLoadResult, WorldLoadError } from '../worlds/types';
import type { WorldConfig } from '../state/types';
import type { ModelLoader } from './types';
import type { StateStore } from '../state/store';
import type { SceneEntity } from '../entity/types';
import { createVesselEntity } from '../entity/vessel/ship';
import { createOceanEntity } from '../entity/environment/ocean';
import { createSkyEntity } from '../entity/environment/sky';
import { createLightingEntity } from '../entity/environment/lighting';
import { createSprayEntity } from '../entity/vessel/spray';
import { createWakeEntity } from '../entity/vessel/wake';
import { createVesselGroup } from '../entity/vessel-group';

export class WorldLoader {
  async load(
    config: WorldConfig,
    modelLoader: ModelLoader,
    store?: StateStore,
  ): Promise<WorldLoadResult> {
    const entities: SceneEntity[] = [];
    const errors: WorldLoadError[] = [];

    if (config.environment.ocean) entities.push(createOceanEntity(store));
    if (config.environment.sky) entities.push(createSkyEntity(store));
    if (config.environment.lighting) entities.push(createLightingEntity(store));

    for (const [id, def] of Object.entries(config.instances)) {
      if (def.behavior === 'vessel') {
        try {
          const model = await modelLoader.load(def.ref);
          entities.push(createVesselGroup(
            id,
            createVesselEntity(model, id),
            createSprayEntity(id),
            createWakeEntity(id),
          ));
        } catch (e) {
          errors.push({ ref: def.ref, error: e instanceof Error ? e : new Error(String(e)) });
        }
      }
    }

    return {
      entities,
      errors,
      metadata: { loadedAt: Date.now() },
    };
  }
}
