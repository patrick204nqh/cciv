import * as THREE from 'three';
import type { SceneEntity, SceneHandle } from '../types';
import type { IMaterial } from '../../scene/types';
import { SceneObject } from '../../scene/object';
import { MaterialAdapter } from '../../scene/material-adapter';
import type { Disposer } from '../../util/disposer';
import { PositionTracker } from '../../util/position-tracker';

const SEGMENTS = 16;
const TRAIL_LENGTH = 60;
const HALF_ANGLE = 0.35;

export function createWakeEntity(vesselId?: string): SceneEntity {
  return {
    id: `wake${vesselId ? '-' + vesselId : ''}`,

    onAttach(scene: SceneHandle, disposer?: Disposer) {
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

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(
        (() => {
          const uvs: number[] = [];
          for (let i = 0; i <= SEGMENTS; i++) {
            uvs.push(i / SEGMENTS, 0, i / SEGMENTS, 1);
          }
          return uvs;
        })(), 2,
      ));
      geo.setIndex(idx);

      const rawMat = new THREE.MeshBasicMaterial({
        color: 0x8ab8d8,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const mat: IMaterial = new MaterialAdapter(rawMat);

      const mesh = new THREE.Mesh(geo, rawMat);
      scene.add(new SceneObject(mesh));
      disposer?.add(geo);
      disposer?.add(rawMat);
      disposer?.add(mesh);

      let prevPos = new THREE.Vector3();
      let intensity = 0;

      if (disposer) {
        const targetId = vesselId ?? 'vessel';
        const tracker = new PositionTracker(targetId);
        tracker.track((evPos, evQuat) => {
          const dx = evPos.x - prevPos.x;
          const dz = evPos.z - prevPos.z;
          const motion = Math.sqrt(dx * dx + dz * dz);
          intensity += (motion * 8 - intensity) * 0.15;
          prevPos.copy(evPos);

          mat.opacity = Math.min(0.1 + intensity * 0.3, 0.2);

          const stern = new THREE.Vector3(0, 0, -56).applyQuaternion(evQuat).add(evPos);
          mesh.position.copy(stern);
          mesh.position.y = -0.35;
          mesh.quaternion.copy(evQuat);
        }, disposer);
      }
    },

    onDetach() {},
  };
}
