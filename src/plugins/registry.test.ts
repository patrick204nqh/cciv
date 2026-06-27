import { describe, it, expect } from 'vitest';
import { PluginRegistry } from './registry';
import type { ScenePlugin } from './types';

describe('PluginRegistry', () => {
  it('returns active plugins for a mode', () => {
    const reg = new PluginRegistry();
    reg.register({ id: 'a', label: 'A', modes: new Set(['edit']), priority: 0 } as ScenePlugin);
    reg.register({ id: 'b', label: 'B', modes: new Set(['play']), priority: 0 } as ScenePlugin);
    expect(reg.getActive('edit')).toHaveLength(1);
    expect(reg.getActive('play')).toHaveLength(1);
  });

  it('sorts by priority', () => {
    const reg = new PluginRegistry();
    reg.register({ id: 'b', label: 'B', modes: new Set(['edit']), priority: 10 } as ScenePlugin);
    reg.register({ id: 'a', label: 'A', modes: new Set(['edit']), priority: 0 } as ScenePlugin);
    const plugins = reg.getAll();
    expect(plugins[0].id).toBe('a');
  });
});
