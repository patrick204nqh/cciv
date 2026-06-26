import * as THREE from 'three';
import type { SceneEntity } from './types';

export function createSkyEntity(): SceneEntity {
  let sky: THREE.Mesh;
  let ring: THREE.Mesh;

  return {
    id: 'sky',

    onAttach(scene: THREE.Scene) {
      const skyGeo = new THREE.SphereGeometry(900, 32, 24);
      const colors = new Float32Array(skyGeo.attributes.position.count * 3);
      const pos = skyGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const t = (y + 900) / 1800;
        colors[i * 3] = 0.35 + t * 0.40;
        colors[i * 3 + 1] = 0.55 + t * 0.35;
        colors[i * 3 + 2] = 0.70 + t * 0.25;
      }
      skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
      scene.add(sky);

      ring = new THREE.Mesh(
        new THREE.CylinderGeometry(860, 860, 140, 32, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x6090b0, side: THREE.BackSide, transparent: true, opacity: 0.25 }),
      );
      ring.position.y = -65;
      scene.add(ring);
    },

    onUpdate(_dt: number) {},

    onDetach() {
      sky.geometry.dispose();
      sky.material.dispose();
      sky.removeFromParent();
      ring.geometry.dispose();
      ring.material.dispose();
      ring.removeFromParent();
    },
  };
}
