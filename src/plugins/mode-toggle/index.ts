import type { ScenePlugin, PluginContext } from '../types';
import { setSidebarCollapsed } from '../sidebar';

export const modeTogglePlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let badge: HTMLElement;
  let controlsHint: HTMLElement;
  let onKey: (e: KeyboardEvent) => void;
  let hintTimer: ReturnType<typeof setTimeout> | null = null;

  function updateBadge() {
    const isEdit = ctx.mode === 'edit';
    badge.textContent = isEdit ? 'EDIT' : 'PLAY';
    badge.className = isEdit ? 'e' : 'p';
  }

  function showHint() {
    controlsHint.classList.remove('h');
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = setTimeout(() => controlsHint.classList.add('h'), 5000);
  }

  return {
    id: 'mode-toggle',
    label: 'Mode Toggle',
    modes: new Set(['edit', 'play']),
    priority: 100,

    init(k: PluginContext) {
      ctx = k;

      badge = document.getElementById('mb')!;
      controlsHint = document.getElementById('ch')!;

      badge.onclick = () => {
        ctx.setMode(ctx.mode === 'edit' ? 'play' : 'edit');
        updateBadge();
        showHint();
      };
      updateBadge();
      showHint();

      onKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          ctx.setMode(ctx.mode === 'edit' ? 'play' : 'edit');
          updateBadge();
          showHint();
        }
      };
      window.addEventListener('keydown', onKey);
    },

    onModeSwitch(_from: 'edit' | 'play', to: 'edit' | 'play') {
      setSidebarCollapsed(to !== 'edit');
    },

    destroy() {
      if (onKey) window.removeEventListener('keydown', onKey);
      if (hintTimer) clearTimeout(hintTimer);
    },
  };
})();
