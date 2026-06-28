// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { performanceHudPlugin } from './index';
import type { PluginContext } from '../types';

function mockPluginContext(): PluginContext {
  return {
    scene: {} as any,
    renderer: { domElement: document.body, info: { render: { calls: 42, triangles: 1200 } } } as any,
    camera: { raw: {} as any, aspect: 1, updateProjectionMatrix: () => {} } as any,
    mode: 'edit',
    selectedObject: null,
    setMode: () => {},
  };
}

describe('performanceHudPlugin', () => {
  let ctx: PluginContext;

  beforeEach(() => {
    document.body.innerHTML = '<div id="ph">— FPS · — DC · — tri</div>';
    ctx = mockPluginContext();
  });

  it('has correct identity', () => {
    expect(performanceHudPlugin.id).toBe('performance-hud');
    expect(performanceHudPlugin.label).toBe('Performance HUD');
  });

  it('is active in both modes', () => {
    expect(performanceHudPlugin.modes.has('edit')).toBe(true);
    expect(performanceHudPlugin.modes.has('play')).toBe(true);
  });

  it('creates HUD element on init', () => {
    performanceHudPlugin.init(ctx);
    expect(document.getElementById('ph')).toBeTruthy();
    performanceHudPlugin.destroy();
  });

  it('destroy does not throw', () => {
    performanceHudPlugin.init(ctx);
    expect(() => performanceHudPlugin.destroy()).not.toThrow();
  });

  it('updates display on render', () => {
    performanceHudPlugin.init(ctx);
    performanceHudPlugin.render(0.016);
    const el = document.getElementById('ph')!;
    expect(el.textContent).toContain('42');
    expect(el.textContent).toContain('1200');
    performanceHudPlugin.destroy();
  });
});
