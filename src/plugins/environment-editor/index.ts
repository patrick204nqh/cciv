import type { ScenePlugin, PluginContext } from '../types';
import { registerTool, destroyTool } from '../sidebar';
import { LocationEnvironmentPanel } from '../../ui/components/location-environment-panel';
import { initLocationCtx } from '../../ui/stores/location-store';

export const environmentEditorPlugin: ScenePlugin = {
  id: 'environment-editor',
  label: 'Location & Environment',
  modes: new Set(['edit', 'play']),
  priority: 5,

  init(ctx: PluginContext) {
    initLocationCtx(ctx);
    registerTool({ id: 'environment-editor', label: 'Location & Environment', icon: '🌍', component: LocationEnvironmentPanel });
  },

  destroy() {
    destroyTool('environment-editor');
  },
};
