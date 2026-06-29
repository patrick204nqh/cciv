import type { SceneEntity } from './types';
import type { ModelLoader } from '../model/types';
import type { StateStore } from '../state/store';
import type { InstanceDef } from '../state/types';

export interface BehaviorDeps {
  modelLoader: ModelLoader;
  store?: StateStore;
}

export interface BehaviorFactory {
  create(id: string, def: InstanceDef, deps: BehaviorDeps): Promise<SceneEntity[]>;
}

export class BehaviorRegistry {
  private factories = new Map<string, BehaviorFactory>();

  register(name: string, factory: BehaviorFactory): void {
    this.factories.set(name, factory);
  }

  get(name: string): BehaviorFactory | undefined {
    return this.factories.get(name);
  }

  async create(id: string, def: InstanceDef, deps: BehaviorDeps): Promise<SceneEntity[]> {
    const name = def.behavior ?? 'static';
    const factory = this.factories.get(name);
    if (!factory) {
      console.warn(`[behavior-registry] unknown behavior "${name}", treating as static`);
      const staticFactory = this.factories.get('static');
      if (!staticFactory) return [];
      return staticFactory.create(id, def, deps);
    }
    return factory.create(id, def, deps);
  }
}

export const behaviorRegistry = new BehaviorRegistry();
