import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { SceneEntity, SceneHandle } from '../types';
import type { IScene } from '../../scene/types';
import type { Disposer } from '../../util/disposer';
import { createPointMaterial } from '../../scene/scene-adapter';

const DROP_COUNT = 2500;
const SPREAD = 350;
const HEIGHT = 200;
const FALL_SPEED = 55;

export function createRainEntity(): SceneEntity {
  let points: import('../../scene/types').ISceneObject | null = null;
  let positions: Float32Array;

  return {
    id: 'rain',

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      const s = scene as IScene;
      const geo = new BufferGeometry();
      positions = new Float32Array(DROP_COUNT * 3);

      for (let i = 0; i < DROP_COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * SPREAD * 2;
        positions[i * 3 + 1] = Math.random() * HEIGHT - 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD * 2;
      }

      geo.setAttribute('position', new Float32BufferAttribute(positions, 3));

      const mat = createPointMaterial({
        size: 3.5,
        color: '#b0c8e8',
        opacity: 0.4,
        transparent: true,
        depthWrite: false,
      });
      points = s.createPoints(geo, mat);
      s.add(points);

      if (disposer) disposer.add(() => points!.dispose());
    },

    onUpdate(dt: number) {
      if (!points) return;
      const geo = points.getGeometryData();
      if (!geo) return;
      const pos = geo.positions;

      for (let i = 0; i < DROP_COUNT; i++) {
        const idx = i * 3;
        pos[idx + 1] -= FALL_SPEED * dt;
        pos[idx] -= 4 * dt; // wind drift
        if (pos[idx + 1] < -30) {
          pos[idx] = (Math.random() - 0.5) * SPREAD * 2;
          pos[idx + 1] = HEIGHT + Math.random() * 20;
          pos[idx + 2] = (Math.random() - 0.5) * SPREAD * 2;
        }
      }

      const obj = (points as any)._obj;
      if (obj?.geometry?.attributes?.position) {
        obj.geometry.attributes.position.needsUpdate = true;
      }
    },

    onDetach() {
      points = null;
    },
  };
}
