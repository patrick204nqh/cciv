import type { ScenePlugin, PluginContext } from '../types';
import { useToastStore } from '../../ui/stores/toast-store';

export const snapshotPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      save();
    }
    if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      load();
    }
  }

  function save() {
    const snap = ctx.state.snapshot();
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cciv-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    useToastStore.getState().show('Snapshot saved', 'success');
  }

  function load() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const state = JSON.parse(text);
        ctx.state.restore(state);
        useToastStore.getState().show('Snapshot loaded', 'success');
      } catch {
        useToastStore.getState().show('Invalid snapshot file', 'error');
      }
    };
    input.click();
  }

  return {
    id: 'snapshot',
    label: 'Snapshot',
    modes: new Set(['edit']),
    priority: 20,

    init(k: PluginContext) {
      ctx = k;
      window.addEventListener('keydown', onKeyDown);
    },

    destroy() {
      window.removeEventListener('keydown', onKeyDown);
    },
  };
})();
