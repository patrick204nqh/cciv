import type { ScenePlugin, PluginContext } from '../types';
import { setSidebarCollapsed } from '../sidebar';
import { useModeStore } from '../../ui/stores/mode-store';

export const modeTogglePlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let onKey: (e: KeyboardEvent) => void;

  function syncMode() {
    useModeStore.getState().setMode(ctx.mode);
  }

  function toggle() {
    ctx.setMode(ctx.mode === 'edit' ? 'play' : 'edit');
    syncMode();
  }

  return {
    id: 'mode-toggle',
    label: 'Mode Toggle',
    modes: new Set(['edit', 'play']),
    priority: 100,

    init(k: PluginContext) {
      ctx = k;
      syncMode();

      onKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          toggle();
        }
      };
      window.addEventListener('keydown', onKey);
    },

    onModeSwitch(_from: 'edit' | 'play', to: 'edit' | 'play') {
      setSidebarCollapsed(to !== 'edit');
    },

    destroy() {
      if (onKey) window.removeEventListener('keydown', onKey);
    },
  };
})();
