import type { SceneEntity } from '../types';
import type { Disposer } from '../../util/disposer';
import type { IScene, IWater } from '../../graphics/types';

export function createOceanEntity(
  extent: number,
  gridSize: number,
  config?: { color?: string },
): SceneEntity {
  let water: IWater | null = null;

  return {
    id: 'ocean',

    onAttach(scene: IScene, disposer?: Disposer) {
      const geo = scene.createPlaneGeometry(extent, extent, gridSize, gridSize);
      water = scene.createWater(geo, {
        color: config?.color ?? '#2090d0',
        scale: 4,
        flowSpeed: 0.015,
        reflectivity: 0.05,
        flowDirection: [0.7, 0.7],
      });
      scene.add(water.object);

      if (disposer) disposer.add(() => water?.dispose());
    },

    onUpdate() {},
    onDetach() {
      water = null;
    },
  };
}
