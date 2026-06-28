import type { ScenePlugin, PluginContext } from '../types';
import { usePerfStore } from '../../ui/stores/perf-store';

export const performanceHudPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let frameCount = 0;
  let fpsAccum = 0;
  let fps = 0;

  return {
    id: 'performance-hud',
    label: 'Performance HUD',
    modes: new Set(['edit', 'play']),
    priority: 90,

    init(k: PluginContext) {
      ctx = k;
    },

    render(dt: number) {
      frameCount++;
      fpsAccum += dt;
      if (fpsAccum >= 0.5) {
        fps = Math.round(frameCount / fpsAccum);
        frameCount = 0;
        fpsAccum = 0;
      }
      const info = ctx.renderer!.info;
      usePerfStore.getState().update({
        fps,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
      });
    },

    destroy() {},
  };
})();
