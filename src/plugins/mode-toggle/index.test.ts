// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { modeTogglePlugin } from './index';
import type { Kernel } from '../types';

function mockKernel(): Kernel {
  return {
    scene: {} as any,
    renderer: {} as any,
    camera: {} as any,
    controls: {} as any,
    store: {} as any,
    container: document.body,
    mode: 'edit',
  };
}

describe('modeTogglePlugin', () => {
  let kernel: Kernel;

  beforeEach(() => {
    document.body.innerHTML = '';
    kernel = mockKernel();
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
    modeTogglePlugin.init(kernel);
    const badge = document.getElementById('mode-badge');
    expect(badge).toBeTruthy();
    expect(badge!.textContent).toBe('EDIT');
    badge!.remove();
  });

  it('destroys removes badge', () => {
    modeTogglePlugin.init(kernel);
    modeTogglePlugin.destroy();
    expect(document.getElementById('mode-badge')).toBeNull();
  });
});
