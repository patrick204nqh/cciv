import type { ScenePlugin } from './types';

export class PluginRegistry {
  private plugins: ScenePlugin[] = [];

  register(plugin: ScenePlugin): void {
    this.plugins.push(plugin);
    this.plugins.sort((a, b) => a.priority - b.priority);
  }

  getAll(): ScenePlugin[] {
    return this.plugins;
  }

  getActive(mode: 'edit' | 'play'): ScenePlugin[] {
    return this.plugins.filter(p => p.modes.has(mode));
  }
}
