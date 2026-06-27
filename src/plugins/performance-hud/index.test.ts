// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { performanceHudPlugin } from './index';
import type { Kernel } from '../types';

function mockKernel(): Kernel {
  return {
    scene: {} as any,
    renderer: { info: { render: { calls: 42, triangles: 1200 } } } as any,
    camera: {} as any,
    controls: {} as any,
    store: {} as any,
    container: document.body,
    mode: 'edit',
    selectedObject: null,
  };
}

describe('performanceHudPlugin', () => {
  let kernel: Kernel;

  beforeEach(() => {
    document.body.innerHTML = '';
    kernel = mockKernel();
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
    performanceHudPlugin.init(kernel);
    expect(document.getElementById('perf-hud')).toBeTruthy();
    performanceHudPlugin.destroy();
  });

  it('removes HUD on destroy', () => {
    performanceHudPlugin.init(kernel);
    performanceHudPlugin.destroy();
    expect(document.getElementById('perf-hud')).toBeNull();
  });

  it('updates display on render', () => {
    performanceHudPlugin.init(kernel);
    performanceHudPlugin.render(0.016);
    const el = document.getElementById('perf-hud')!;
    expect(el.textContent).toContain('42');
    expect(el.textContent).toContain('1200');
    performanceHudPlugin.destroy();
  });
});
