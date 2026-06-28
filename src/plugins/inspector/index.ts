import type { ScenePlugin, PluginContext } from '../types';
import { registerTool, destroyTool } from '../sidebar';
import { useInspectorStore } from '../../ui/stores/inspector-store';
import { InspectorPanel } from '../../ui/components/inspector-panel';

export const inspectorPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let unsub: (() => void) | null = null;

  function rebuild() {
    useInspectorStore.getState().rebuild(ctx);
  }

  return {
    id: 'inspector',
    label: 'Inspector',
    modes: new Set(['edit']),
    priority: 10,

    init(k: PluginContext) {
      ctx = k;
      rebuild();
      unsub = ctx.state.subscribe('activeLocation', () => rebuild());
      registerTool({
        id: 'inspector',
        label: 'Inspector',
        icon: '⚙',
        component: InspectorPanel,
      });
    },

    destroy() {
      unsub?.();
      destroyTool('inspector');
    },
  };
})();
