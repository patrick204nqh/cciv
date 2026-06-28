// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { modeTogglePlugin } from './index';
import { useModeStore } from '../../ui/stores/mode-store';
import type { PluginContext } from '../types';

function mockPluginContext(): PluginContext {
  return {
    scene: {} as any,
    store: {} as any,
    mode: 'edit',
    selectedObject: null,
    setMode: () => {},
  };
}

describe('modeTogglePlugin', () => {
  let ctx: PluginContext;

  beforeEach(() => {
    useModeStore.setState({ mode: 'edit' });
    ctx = mockPluginContext();
  });

  it('has correct identity', () => {
    expect(modeTogglePlugin.id).toBe('mode-toggle');
    expect(modeTogglePlugin.label).toBe('Mode Toggle');
  });

  it('is active in both modes', () => {
    expect(modeTogglePlugin.modes.has('edit')).toBe(true);
    expect(modeTogglePlugin.modes.has('play')).toBe(true);
  });

  it('has priority 100', () => {
    expect(modeTogglePlugin.priority).toBe(100);
  });

  it('syncs store on init', () => {
    modeTogglePlugin.init(ctx);
    expect(useModeStore.getState().mode).toBe('edit');
    modeTogglePlugin.destroy();
  });
});
