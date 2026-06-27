import type { ScenePlugin, PluginContext } from '../types';
import { LOCATION_PRESETS, CCIV_WORLD } from '../../state/worlds';
import { registerTool, destroyTool } from '../sidebar';

export const locationSwitcherPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let select: HTMLSelectElement | null = null;
  let transitioning = false;

  function switchTo(locationId: string) {
    if (transitioning) return;
    const preset = LOCATION_PRESETS[locationId];
    if (!preset) return;

    transitioning = true;
    const prevEnv = ctx.store.get('environment') as Record<string, unknown>;

    const start = performance.now();
    const duration = 2000;
    function tick() {
      const t = Math.min((performance.now() - start) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      const currFog = ctx.store.get('environment.fog') as Record<string, unknown>;
      if (typeof currFog.density === 'number' && prevEnv.fog && typeof prevEnv.fog === 'object') {
        const prevDensity = (prevEnv.fog as Record<string, unknown>).density as number;
        const nextDensity = preset.environment.fog.density;
        ctx.store.set('environment.fog.density', prevDensity + (nextDensity - prevDensity) * ease);
      }

      if (t >= 1) {
        ctx.store.set('environment', preset.environment as unknown as Record<string, unknown>);
        ctx.store.set('instances', preset.instances as unknown as Record<string, unknown>);
        ctx.store.set('activeLocation', locationId);
        transitioning = false;
      } else {
        requestAnimationFrame(tick);
      }
    }
    tick();
  }

  function initPanel(container: HTMLElement) {
    select = document.createElement('select');

    for (const locId of CCIV_WORLD.locations) {
      const opt = document.createElement('option');
      opt.value = locId;
      opt.textContent = locId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      select.appendChild(opt);
    }

    select.value = ctx.store.get('activeLocation') as string;
    select.addEventListener('change', () => switchTo(select.value));
    container.appendChild(select);
  }

  return {
    id: 'location-switcher',
    label: 'Location Switcher',
    modes: new Set(['edit']),
    priority: 5,

    init(k: PluginContext) {
      ctx = k;
      registerTool({
        id: 'location-switcher',
        label: 'Locations',
        icon: '🌍',
        init: initPanel,
      });
    },

    destroy() {
      select = null;
      destroyTool('location-switcher');
    },
  };
})();
