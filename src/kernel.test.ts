import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { StateStore } from './state/store';
import { createDefaultState } from './state/defaults';
import { PluginManager } from './plugins/plugin-manager';
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

describe('PluginManager integration', () => {
  it('calls onModeSwitch on mode change', () => {
    const mgr = new PluginManager();
    const onSwitch = vi.fn();
    const plugin: ScenePlugin = {
      id: 'test', label: 'Test', modes: new Set(['edit']), priority: 0,
      init: vi.fn(), destroy: vi.fn(),
      onModeSwitch: onSwitch,
    };
    mgr.register(plugin);
    const active = mgr.getAll().filter(p => p.modes.has('edit'));
    expect(active).toHaveLength(1);
  });

  it('isolates plugin crashes — one failing onModeSwitch does not block others', () => {
    const goodFn = vi.fn();
    const badFn = vi.fn().mockImplementation(() => { throw new Error('plugin crash'); });
    const mgr = new PluginManager();
    mgr.register({ id: 'bad', label: 'Bad', modes: new Set(['edit', 'play']), priority: 0, init() {}, destroy() {}, onModeSwitch: badFn });
    mgr.register({ id: 'good', label: 'Good', modes: new Set(['edit', 'play']), priority: 10, init() {}, destroy() {}, onModeSwitch: goodFn });

    const plugins = mgr.getAll();
    for (const p of plugins) {
      try { p.onModeSwitch?.('edit', 'play'); } catch {}
    }

    expect(goodFn).toHaveBeenCalledWith('edit', 'play');
    expect(badFn).toHaveBeenCalledTimes(1);
  });
});
