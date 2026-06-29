import type { ScenePlugin } from '../types';
import { entityManager } from '../../entity/manager';
import { worldClock } from '../../util/world-clock';
import { physicsWorld } from '../../physics';

export const simulationPlugin: ScenePlugin = {
  id: 'simulation',
  label: 'Simulation',
  modes: new Set(['play']),
  priority: 30,

  render(dt: number) {
    worldClock.update(dt);
    physicsWorld.step(dt);
    entityManager.update(dt);
  },

  init() {},
  destroy() {},
};
