import * as THREE from 'three';
import type { SceneEntity } from './types';
import { bus } from '../event-bus';

const SEGMENTS = 16;
const TRAIL_LENGTH = 60;
const HALF_ANGLE = 0.35;

export function createWakeEntity(): SceneEntity {
  let mesh: THREE.Mesh;
  let unsubscribe: (() => void) | null = null;

  return {
    id: 'wake',

    onAttach(scene: THREE.Scene) {
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

      const mat = new THREE.MeshBasicMaterial({
        color: 0x8ab8d8,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      unsubscribe = bus.on('entity:position-changed', (ev) => {
        if (ev.entityId === 'ship') {
          const stern = new THREE.Vector3(0, 0, -56).applyQuaternion(ev.quaternion).add(ev.position);
          mesh.position.copy(stern);
          mesh.position.y = -0.35;
          mesh.quaternion.copy(ev.quaternion);
        }
      });
    },

    onBeforeUpdate(_dt: number) {},
    onUpdate(_dt: number) {},

    onDetach() {
      if (unsubscribe) unsubscribe();
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh.removeFromParent();
    },
  };
}
