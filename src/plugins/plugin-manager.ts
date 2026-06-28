import { PluginRegistry } from '../plugins/registry';
import type { ScenePlugin, PluginContext } from '../plugins/types';

export class PluginManager {
  readonly registry: PluginRegistry;
  private initialized = false;

  constructor() {
    this.registry = new PluginRegistry();
  }

  register(plugin: ScenePlugin): void {
    this.registry.register(plugin);
  }

  init(ctx: PluginContext, mode: 'edit' | 'play'): void {
    for (const p of this.registry.getActive(mode)) {
      p.init(ctx);
    }
    this.initialized = true;
  }

  onModeSwitch(prev: 'edit' | 'play', next: 'edit' | 'play'): void {
    for (const p of this.registry.getAll()) {
      try {
        p.onModeSwitch?.(prev, next);
      } catch (e) {
        console.warn(`[plugin-manager] onModeSwitch error in plugin "${p.id}":`, e);
      }
    }
  }

  render(dt: number, mode: 'edit' | 'play'): void {
    for (const p of this.registry.getActive(mode)) {
      p.render?.(dt);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
