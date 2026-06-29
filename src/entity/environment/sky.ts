import type { SceneEntity } from '../types';
import type { Disposer } from '../../util/disposer';
import type { IScene, ISkyConfig } from '../../graphics/types';

export function createSkyEntity(config: ISkyConfig): SceneEntity {
  let mesh: ReturnType<IScene['createSky']> | null = null;

  return {
    id: 'sky',

    onAttach(scene: IScene, disposer?: Disposer) {
      mesh = scene.createSky(config);
      scene.add(mesh);
      if (disposer) disposer.add(() => mesh?.dispose());
    },

    onUpdate() {},
    onDetach() {
      mesh = null;
    },
  };
}
