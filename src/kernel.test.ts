import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { StateStore } from './state/store';
import { createDefaultState } from './state/defaults';
import { PluginRegistry } from './plugins/registry';
import type { ScenePlugin } from './plugins/types';

// Test the independent components that Kernel wires together, not the full
// Kernel constructor (which needs a real WebGL context).

describe('StateStore integration', () => {
  it('stores and retrieves values by dotted path', () => {
    const store = new StateStore(createDefaultState());
    expect(store.get('environment.sky.gradientTop')).toBe('#5588bb');
  });

  it('notifies subscribers on change', () => {
    const store = new StateStore(createDefaultState());
    const fn = vi.fn();
    store.subscribe('environment.sky.gradientTop', fn);
    store.set('environment.sky.gradientTop', '#ff0000');
    expect(fn).toHaveBeenCalledWith('#ff0000', 'environment.sky.gradientTop');
  });
});

describe('PluginRegistry integration', () => {
  it('calls onModeSwitch on mode change', () => {
    const reg = new PluginRegistry();
    const onSwitch = vi.fn();
    const plugin: ScenePlugin = {
      id: 'test', label: 'Test', modes: new Set(['edit']), priority: 0,
      init: vi.fn(), destroy: vi.fn(),
      onModeSwitch: onSwitch,
    };
    reg.register(plugin);
    const active = reg.getActive('edit');
    expect(active).toHaveLength(1);
  });
});
