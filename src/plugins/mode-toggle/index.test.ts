// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { modeTogglePlugin } from './index';
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
    document.body.innerHTML = '';
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

  it('creates a mode badge on init', () => {
    modeTogglePlugin.init(ctx);
    const badge = document.getElementById('mode-badge');
    expect(badge).toBeTruthy();
    expect(badge!.textContent).toBe('EDIT');
    badge!.remove();
  });

  it('destroys removes badge', () => {
    modeTogglePlugin.init(ctx);
    modeTogglePlugin.destroy();
    expect(document.getElementById('mode-badge')).toBeNull();
  });
});
