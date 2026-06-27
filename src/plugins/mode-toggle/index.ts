import type { ScenePlugin, Kernel } from '../types';

export const modeTogglePlugin: ScenePlugin = (() => {
  let kernel: Kernel;
  let badge: HTMLElement;
  let onKey: (e: KeyboardEvent) => void;

  function updateBadge() {
    badge.textContent = kernel.mode === 'edit' ? 'EDIT' : 'PLAY';
    badge.style.background = kernel.mode === 'edit' ? '#448' : '#844';
  }

  return {
    id: 'mode-toggle',
    label: 'Mode Toggle',
    modes: new Set(['edit', 'play']),
    priority: 100,

    init(k: Kernel) {
      kernel = k;

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
      badge.onclick = () => { kernel.setMode(kernel.mode === 'edit' ? 'play' : 'edit'); updateBadge(); };
      document.body.appendChild(badge);
      updateBadge();

      onKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          kernel.setMode(kernel.mode === 'edit' ? 'play' : 'edit');
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
