import type { ScenePlugin, PluginContext } from '../types';
import { PhysicsDebugRenderer, physicsWorld } from '../../physics';
import { usePhysicsDebugStore } from '../../ui/stores/physics-debug-store';

export const physicsDebugPlugin: ScenePlugin = (() => {
  let renderer: PhysicsDebugRenderer;
  let onKey: (e: KeyboardEvent) => void;

  return {
    id: 'physics-debug',
    label: 'Physics Debug',
    modes: new Set(['edit', 'play']),
    priority: 100,

    init(ctx: PluginContext) {
      renderer = new PhysicsDebugRenderer();
      ctx.scene.add(renderer.root);

      onKey = (e: KeyboardEvent) => {
        if (e.key === '`' || e.key === 'F3') {
          renderer.toggle();
          usePhysicsDebugStore.getState().toggle();
        }
      };
      window.addEventListener('keydown', onKey);
    },

    render() {
      renderer.sync(physicsWorld.allBodies);
    },

    destroy() {
      window.removeEventListener('keydown', onKey);
      renderer.dispose();
      usePhysicsDebugStore.getState().setVisible(false);
    },
  };
})();
