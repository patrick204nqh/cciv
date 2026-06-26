import * as THREE from 'three';
import type { SceneEntity } from './types';
import { Disposer } from '../util/disposer';

export function createSkyEntity(): SceneEntity {
  const disp = new Disposer();

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
      const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
      const sky = new THREE.Mesh(skyGeo, skyMat);
      scene.add(sky);
      disp.addGeo(skyGeo);
      disp.addMat(skyMat);
      disp.addObj(sky);

      const ringGeo = new THREE.CylinderGeometry(860, 860, 140, 32, 1, true);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x6090b0, side: THREE.BackSide, transparent: true, opacity: 0.25 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = -65;
      scene.add(ring);
      disp.addGeo(ringGeo);
      disp.addMat(ringMat);
      disp.addObj(ring);
    },

    onUpdate(_dt: number) {},

    onDetach() {
      disp.dispose();
    },
  };
}
