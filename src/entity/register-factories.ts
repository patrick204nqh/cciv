import type { ModelLoader } from '../loaders/types';
import type { StateStore } from '../state/store';
import type { WorldConfig } from '../state/types';
import type { SceneEntity } from './types';
import type { FactoryResult } from './entity-registry';
import type { BehaviorDeps } from './behavior-registry';
import { entityRegistry } from './entity-registry';
import { behaviorRegistry } from './behavior-registry';
import { createOceanEntity } from './environment/ocean';
import { createSkyEntity } from './environment/sky';
import { createLightingEntity } from './environment/lighting';
import { createVesselEntity } from './vessel/ship';
import { createSprayEntity } from './vessel/spray';
import { createWakeEntity } from './vessel/wake';
import { createVesselGroup } from './vessel-group';

// ── Environment factories (config-shape dispatch) ──

entityRegistry.register({
  async match(config: WorldConfig, _modelLoader: ModelLoader, store?: StateStore): Promise<FactoryResult> {
    const entities: SceneEntity[] = [];
    if (config.environment.ocean) entities.push(createOceanEntity(store));
    if (config.environment.sky) entities.push(createSkyEntity(store));
    if (config.environment.lighting) entities.push(createLightingEntity(store));
    return { entities, errors: [] };
  },
});

// ── Instance factories (behavior-keyed dispatch) ──

entityRegistry.register({
  async match(config: WorldConfig, modelLoader: ModelLoader, store?: StateStore): Promise<FactoryResult> {
    const entities: SceneEntity[] = [];
    const errors: { ref: string; error: Error }[] = [];
    const deps: BehaviorDeps = { modelLoader, store };

    for (const [id, def] of Object.entries(config.instances)) {
      if (def.behavior && def.behavior !== 'static') {
        try {
          const created = await behaviorRegistry.create(id, def, deps);
          entities.push(...created);
        } catch (e) {
          errors.push({ ref: def.ref, error: e instanceof Error ? e : new Error(String(e)) });
        }
      }
    }
    return { entities, errors };
  },
});

// ── Built-in behaviors ──

behaviorRegistry.register('vessel', {
  async create(id: string, def, deps: BehaviorDeps): Promise<SceneEntity[]> {
    const model = await deps.modelLoader.load(def.ref);
    return [createVesselGroup(
      id,
      createVesselEntity(model, id),
      createSprayEntity(id),
      createWakeEntity(id),
    )];
  },
});
