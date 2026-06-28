import { BufferAttribute, BackSide } from 'three';
import type { IScene } from '../../scene/types';
import type { SceneEntity, SceneHandle } from '../types';
import type { Disposer } from '../../util/disposer';
import { entityRegistry } from '../entity-registry';
import type { ModelLoader } from '../../loaders/types';
import type { WorldConfig } from '../../state/types';
import { createBasicMaterial } from '../../scene/scene-adapter';

entityRegistry.register({
  async match(config: WorldConfig, _modelLoader: ModelLoader) {
    if (!config.environment.sky) return { entities: [], errors: [] };
    return { entities: [createSkyEntity()], errors: [] };
  },
});

export function createSkyEntity(): SceneEntity {
  return {
    id: 'sky',

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      const s = scene as IScene;
      const skyGeo = s.createSphereGeometry(900, 32, 24);
      const pos = skyGeo.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const t = (y + 900) / 1800;
        const topRgb = [0.4, 0.6, 0.9];
        const botRgb = [0.9, 0.85, 0.7];
        colors[i * 3] = botRgb[0] + (topRgb[0] - botRgb[0]) * t;
        colors[i * 3 + 1] = botRgb[1] + (topRgb[1] - botRgb[1]) * t;
        colors[i * 3 + 2] = botRgb[2] + (topRgb[2] - botRgb[2]) * t;
      }
      skyGeo.setAttribute('color', new BufferAttribute(colors, 3));

      const mat = createBasicMaterial({ vertexColors: true, side: BackSide });
      const mesh = s.createMesh(skyGeo, mat);
      s.add(mesh);

      if (disposer) disposer.add(() => mesh.dispose());
    },

    onUpdate() {},
    onDetach() {},
  };
}
