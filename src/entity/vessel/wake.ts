import { BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute } from 'three';
import type { SceneEntity } from '../types';
import type { Disposer } from '../../util/disposer';
import { PositionTracker } from '../../util/position-tracker';
import { bus } from '../../event-bus';
import { createPointMaterial } from '../../scene/scene-adapter';

const SEGMENTS = 16;
const TRAIL_LENGTH = 60;
const HALF_ANGLE = 0.35;

export function createWakeEntity(vesselId?: string): SceneEntity {
  return {
    id: `wake${vesselId ? '-' + vesselId : ''}`,

    onAttach(scene, disposer?: Disposer) {
      const verts: number[] = [];
      const idx: number[] = [];

      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const dist = t * TRAIL_LENGTH;
        const spread = dist * Math.tan(HALF_ANGLE);
        verts.push(-dist, 0, -spread);
        verts.push(-dist, 0, spread);
      }

      for (let i = 0; i < SEGMENTS; i++) {
        const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
        idx.push(a, c, b, b, c, d);
      }

      const geo = new BufferGeometry();
      geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
      geo.setIndex(new Uint16BufferAttribute(idx, 1));

      const mat = createPointMaterial({
        size: 0.8,
        color: '#c0d8e8',
        opacity: 0.25,
        transparent: true,
        depthWrite: false,
      });
      const wake = scene.createPoints(geo, mat);
      scene.add(wake);

      if (disposer) disposer.add(() => wake.dispose());
    },

    onUpdate() {},
    onDetach() {},
  };
}
