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
      el = document.createElement('div');
      el.id = 'perf-hud';
      Object.assign(el.style, {
        position: 'fixed',
        top: '12px',
        right: '12px',
        padding: '6px 10px',
        borderRadius: '4px',
        color: '#8c8',
        font: '12px monospace',
        background: 'rgba(0,0,0,0.6)',
        zIndex: '999',
        pointerEvents: 'none',
        userSelect: 'none',
      });
      document.body.appendChild(el);
    },

    render(dt: number) {
      frameCount++;
      fpsAccum += dt;
      if (fpsAccum >= 0.5) {
        fps = Math.round(frameCount / fpsAccum);
        frameCount = 0;
        fpsAccum = 0;
      }
      const info = ctx.renderer.info;
      el.textContent = `${fps} FPS · ${info.render.calls} DC · ${info.render.triangles} tri`;
    },

    destroy() {
      el?.remove();
    },
  };
})();
