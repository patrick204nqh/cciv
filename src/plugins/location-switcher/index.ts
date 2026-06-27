import type { ScenePlugin, Kernel } from '../types';
import { LOCATION_PRESETS, CCIV_WORLD } from '../../state/worlds';

export const locationSwitcherPlugin: ScenePlugin = (() => {
  let kernel: Kernel;
  let select: HTMLSelectElement;
  let transitioning = false;

  function switchTo(locationId: string) {
    if (transitioning) return;
    const preset = LOCATION_PRESETS[locationId];
    if (!preset) return;

    transitioning = true;
    const prevEnv = kernel.store.get('environment') as Record<string, unknown>;

    const start = performance.now();
    const duration = 2000;
    function tick() {
      const t = Math.min((performance.now() - start) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      const currFog = kernel.store.get('environment.fog') as Record<string, unknown>;
      if (typeof currFog.density === 'number' && prevEnv.fog && typeof prevEnv.fog === 'object') {
        const prevDensity = (prevEnv.fog as Record<string, unknown>).density as number;
        const nextDensity = preset.environment.fog.density;
        kernel.store.set('environment.fog.density', prevDensity + (nextDensity - prevDensity) * ease);
      }

      if (t >= 1) {
        kernel.store.set('environment', preset.environment as unknown as Record<string, unknown>);
        kernel.store.set('instances', preset.instances as unknown as Record<string, unknown>);
        kernel.store.set('activeLocation', locationId);
        transitioning = false;
      } else {
        requestAnimationFrame(tick);
      }
    }
    tick();
  }

  return {
    id: 'location-switcher',
    label: 'Location Switcher',
    modes: new Set(['edit']),
    priority: 5,

    init(k: Kernel) {
      kernel = k;
      select = document.createElement('select');
      select.style.cssText = 'position:fixed;top:8px;left:8px;z-index:1000;padding:4px 8px;font-size:13px;';

      for (const locId of CCIV_WORLD.locations) {
        const opt = document.createElement('option');
        opt.value = locId;
        opt.textContent = locId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        select.appendChild(opt);
      }

      select.value = kernel.store.get('activeLocation') as string;
      select.addEventListener('change', () => switchTo(select.value));
      document.body.appendChild(select);
    },

    destroy() {
      select.remove();
    },
  };
})();
