import type { SceneEntity } from '../types';
import type { Disposer } from '../../util/disposer';
import type { IScene, IWater, OceanConfig } from '../../graphics/types';

export function createOceanEntity(config: OceanConfig): SceneEntity {
  let water: IWater | null = null;

  return {
    id: 'ocean',

    onAttach(scene: IScene, disposer?: Disposer) {
      water = scene.createWater(config);
      scene.add(water.object);

      if (disposer) disposer.add(() => water?.dispose());
    },

    onUpdate() {},
    onDetach() {
      water = null;
    },
  };
}
