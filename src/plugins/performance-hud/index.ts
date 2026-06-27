import type { ScenePlugin, PluginContext } from '../types';

export const performanceHudPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let el: HTMLElement;
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
      el = document.getElementById('ph')!;
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
      el.textContent = `${fps} FPS · ${info.render.calls} DC · ${info.render.triangles} tri`;
    },

    destroy() {},
  };
})();
