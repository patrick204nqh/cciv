import type { ScenePlugin, PluginContext } from '../types';
import { registerTool, destroyTool } from '../sidebar';
import { initLocationCtx } from '../../ui/stores/location-store';
import { LocationSwitcherPanel } from '../../ui/components/location-switcher';

export const locationSwitcherPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;

  return {
    id: 'location-switcher',
    label: 'Location Switcher',
    modes: new Set(['edit']),
    priority: 5,

    init(k: PluginContext) {
      ctx = k;
      initLocationCtx(ctx);
      registerTool({
        id: 'location-switcher',
        label: 'Locations',
        icon: '🌍',
        component: LocationSwitcherPanel,
      });
    },

    destroy() {
      destroyTool('location-switcher');
    },
  };
})();
