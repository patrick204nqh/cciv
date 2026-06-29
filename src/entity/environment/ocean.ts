import type { SceneEntity } from '../types';
import type { Disposer } from '../../util/disposer';
import type { IScene, IWater, WaveData } from '../../graphics/types';

export function createOceanEntity(
  extent: number,
  gridSize: number,
  config: { color: string; waves: WaveData[] },
): SceneEntity {
  let water: IWater | null = null;

  return {
    id: 'ocean',

    onAttach(scene: IScene, disposer?: Disposer) {
      const geo = scene.createPlaneGeometry(extent, extent, gridSize, gridSize);
      water = scene.createWater(geo, config);
      scene.add(water.object);

      if (disposer) disposer.add(() => water?.dispose());
    },

    onUpdate() {},
    onDetach() {
      water = null;
    },
  };
}
