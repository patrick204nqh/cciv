import type { ModelLoader } from '../model/types';
import type { StateStore } from '../state/store';
import type { WorldConfig } from '../state/types';
import type { FactoryResult } from './entity-registry';
import type { BehaviorDeps } from './behavior-registry';
import { entityRegistry } from './entity-registry';
import { behaviorRegistry } from './behavior-registry';

// Side-effect imports — each module auto-registers at import time
import './environment';
import './vessel/ship';

// Instance dispatch — iterates config.instances, delegates to BehaviorRegistry
entityRegistry.register({
  async match(config: WorldConfig, modelLoader: ModelLoader, store?: StateStore): Promise<FactoryResult> {
    const entities: import('./types').SceneEntity[] = [];
    const errors: import('../model/types').WorldLoadError[] = [];
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
