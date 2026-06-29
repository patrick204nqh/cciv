import type { ScenePlugin, PluginContext } from '../types';
import { registerTool, destroyTool } from '../sidebar';
import { LocationEnvironmentPanel } from '../../ui/components/location-environment-panel';

export const environmentEditorPlugin: ScenePlugin = {
  id: 'environment-editor',
  label: 'Location & Environment',
  modes: new Set(['edit', 'play']),
  priority: 5,

  init(_ctx: PluginContext) {
    registerTool({ id: 'environment-editor', label: 'Location & Environment', icon: '🌍', component: LocationEnvironmentPanel });
  },

  destroy() {
    destroyTool('environment-editor');
  },
};
