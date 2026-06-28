import type { SceneEntity, GeometryHandle, IScene } from '../../scene/types';
import type { Disposer } from '../../util/disposer';
import { createPointMaterial } from '../../scene/scene-adapter';

const DROP_COUNT = 2500;
const SPREAD = 350;
const HEIGHT = 200;
const FALL_SPEED = 55;

export function createRainEntity(): SceneEntity {
  let points: import('../../scene/types').ISceneObject | null = null;
  let geo: GeometryHandle | null = null;
  let _scene: IScene | null = null;
  let positions: Float32Array;

  return {
    id: 'rain',

    onAttach(scene, disposer?: Disposer) {
      _scene = scene;
      geo = scene.createBufferGeometry();
      positions = new Float32Array(DROP_COUNT * 3);

      for (let i = 0; i < DROP_COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * SPREAD * 2;
        positions[i * 3 + 1] = Math.random() * HEIGHT - 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD * 2;
      }

      scene.setAttribute(geo, 'position', positions, 3);

      const mat = createPointMaterial({
        size: 3.5,
        color: '#b0c8e8',
        opacity: 0.4,
        transparent: true,
        depthWrite: false,
      });
      points = scene.createPoints(geo, mat);
      scene.add(points);

      if (disposer) disposer.add(() => points!.dispose());
    },

    onUpdate(dt: number) {
      if (!points || !geo || !_scene) return;

      for (let i = 0; i < DROP_COUNT; i++) {
        const idx = i * 3;
        positions[idx + 1] -= FALL_SPEED * dt;
        positions[idx] -= 4 * dt;
        if (positions[idx + 1] < -30) {
          positions[idx] = (Math.random() - 0.5) * SPREAD * 2;
          positions[idx + 1] = HEIGHT + Math.random() * 20;
          positions[idx + 2] = (Math.random() - 0.5) * SPREAD * 2;
        }
      }

      _scene.markAttributeDirty(geo, 'position');
    },

    onDetach() {
      points = null;
    },
  };
}
