import * as THREE from 'three';
import type { SceneEntity } from './types';
import type { Disposer } from '../util/disposer';
import type { StateStore } from '../state/store';

export function createSkyEntity(store?: StateStore): SceneEntity {
  let unsubs: (() => void)[] = [];

  return {
    id: 'sky',

    onAttach(scene: THREE.Scene, disposer?: Disposer) {
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
      disposer?.addGeo(skyGeo);
      disposer?.addMat(skyMat);
      disposer?.addObj(sky);

      const ringGeo = new THREE.CylinderGeometry(860, 860, 140, 32, 1, true);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x6090b0, side: THREE.BackSide, transparent: true, opacity: 0.25 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = -65;
      scene.add(ring);
      disposer?.addGeo(ringGeo);
      disposer?.addMat(ringMat);
      disposer?.addObj(ring);

      if (store) {
        unsubs.push(store.subscribe('environment.sky', (v) => {
          const cfg = v as any;
          const cArr = skyGeo.attributes.color.array as Float32Array;
          const p = skyGeo.attributes.position;
          for (let i = 0; i < p.count; i++) {
            const y = p.getY(i);
            const t = (y + 900) / 1800;
            const top = new THREE.Color(cfg.gradientTop);
            const bottom = new THREE.Color(cfg.gradientBottom);
            const c = bottom.clone().lerp(top, t);
            cArr[i * 3] = c.r;
            cArr[i * 3 + 1] = c.g;
            cArr[i * 3 + 2] = c.b;
          }
          skyGeo.attributes.color.needsUpdate = true;
        }));
      }
    },

    onDetach() {
      unsubs.forEach(fn => fn());
    },
  };
}
