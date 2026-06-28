import type { ScenePlugin, PluginContext } from '../types';

export const shipHudPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let logEl: HTMLElement | null = null;
  let windEl: HTMLElement | null = null;
  let swellEl: HTMLElement | null = null;
  let timeEl: HTMLElement | null = null;
  let headingEl: HTMLElement | null = null;
  let timeAccum = 0;

  return {
    id: 'ship-hud',
    label: 'Ship HUD',
    modes: new Set(['play']),
    priority: 50,

    init(k: PluginContext) {
      ctx = k;

      logEl = document.getElementById('sl')!;
      windEl = document.getElementById('sl-wind')!;
      swellEl = document.getElementById('sl-swell')!;
      timeEl = document.getElementById('sl-time')!;
      headingEl = document.getElementById('sl-heading')!;
    },

    onModeSwitch(_from: 'edit' | 'play', to: 'edit' | 'play') {
      if (!logEl) return;
      logEl.classList.toggle('on', to === 'play');
      if (to === 'play') timeAccum = 0;
    },

    render(dt: number) {
      if (!logEl) return;

      const env = ctx.state.get('environment') as any;

      const windSpeed = (env.ocean?.windSpeed ?? 12).toFixed(1);
      const swellHeight = (env.ocean?.swellHeight ?? 2.4).toFixed(1);
      windEl.textContent = `${windSpeed} kn`;
      swellEl.textContent = `${swellHeight} m`;

      timeAccum += dt;
      const totalMinutes = Math.floor(timeAccum * 1.5) % 1440;
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      timeEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} Z`;

      const heading = ((timeAccum * 0.3) % 360).toFixed(1);
      headingEl.textContent = `${heading}°`;
    },

    destroy() {
      logEl?.classList.remove('on');
    },
  };
})();
