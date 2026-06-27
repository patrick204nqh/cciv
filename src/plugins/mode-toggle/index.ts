import type { ScenePlugin, PluginContext } from '../types';

export const modeTogglePlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let badge: HTMLElement;
  let onKey: (e: KeyboardEvent) => void;

  function updateBadge() {
    badge.textContent = ctx.mode === 'edit' ? 'EDIT' : 'PLAY';
    badge.style.background = ctx.mode === 'edit' ? '#448' : '#844';
  }

  return {
    id: 'mode-toggle',
    label: 'Mode Toggle',
    modes: new Set(['edit', 'play']),
    priority: 100,

    init(k: PluginContext) {
      ctx = k;

      badge = document.createElement('div');
      badge.id = 'mode-badge';
      Object.assign(badge.style, {
        position: 'fixed',
        bottom: '12px',
        right: '12px',
        padding: '6px 14px',
        borderRadius: '4px',
        color: '#fff',
        font: 'bold 13px monospace',
        cursor: 'pointer',
        zIndex: '1000',
        userSelect: 'none',
        background: '#448',
      });
      badge.onclick = () => { ctx.setMode(ctx.mode === 'edit' ? 'play' : 'edit'); updateBadge(); };
      document.body.appendChild(badge);
      updateBadge();

      onKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          ctx.setMode(ctx.mode === 'edit' ? 'play' : 'edit');
          updateBadge();
        }
      };
      window.addEventListener('keydown', onKey);
    },

    destroy() {
      badge?.remove();
      if (onKey) window.removeEventListener('keydown', onKey);
    },
  };
})();
