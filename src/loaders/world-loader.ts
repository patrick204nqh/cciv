import type { WorldConfig } from '../worlds/types';
import type { ModelLoader, WorldLoadResult } from './types';

export class WorldLoader {
  async load(
    config: WorldConfig,
    modelLoader: ModelLoader,
  ): Promise<WorldLoadResult> {
    const entries = [];

    for (const inst of config.models) {
      const model = await modelLoader.load(inst.ref);
      entries.push({ model, instance: inst });
    }

    return { config, entries };
  }
}
