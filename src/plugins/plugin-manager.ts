import type { ScenePlugin, PluginContext } from '../plugins/types';

export class PluginManager {
  private plugins: ScenePlugin[] = [];
  private initialized = false;

  register(plugin: ScenePlugin): void {
    this.plugins.push(plugin);
    this.plugins.sort((a, b) => a.priority - b.priority);
  }

  private getActive(mode: 'edit' | 'play'): ScenePlugin[] {
    return this.plugins.filter(p => p.modes.has(mode));
  }

  getAll(): ScenePlugin[] {
    return this.plugins;
  }

  init(ctx: PluginContext, mode: 'edit' | 'play'): void {
    for (const p of this.getActive(mode)) {
      p.init(ctx);
    }
    this.initialized = true;
  }

  onModeSwitch(prev: 'edit' | 'play', next: 'edit' | 'play'): void {
    for (const p of this.plugins) {
      try {
        p.onModeSwitch?.(prev, next);
      } catch (e) {
        console.warn(`[plugin-manager] onModeSwitch error in plugin "${p.id}":`, e);
      }
    }
  }

  render(dt: number, mode: 'edit' | 'play'): void {
    for (const p of this.getActive(mode)) {
      p.render?.(dt);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
