import * as THREE from 'three';
import type { WorldLoadResult } from '../worlds/types';
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
        const model = await modelLoader.load(def.ref);
        const vessel = createVesselEntity(model, id);
        entities.push(vessel);

        const spray = createSprayEntity(id);
        entities.push(spray);

        const wake = createWakeEntity(id);
        entities.push(wake);
      }
    }

    return { entities };
  }
}
