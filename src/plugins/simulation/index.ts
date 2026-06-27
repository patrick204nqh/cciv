import type { ScenePlugin } from '../types';
import { entityManager } from '../../entity/manager';

export const simulationPlugin: ScenePlugin = {
  id: 'simulation',
  label: 'Simulation',
  modes: new Set(['play']),
  priority: 30,

  render(dt: number) {
    entityManager.update(dt);
  },

  init() {},
  destroy() {},
};
