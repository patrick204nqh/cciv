import * as THREE from 'three';
import type { SceneEntity, SceneHandle } from './types';
import { SceneObject } from '../scene/object';
import type { Disposer } from '../util/disposer';
import type { StateStore } from '../state/store';
import { createSkyMaterial, createRingMaterial } from '../rendering/materials';
import { EntityStateBinding } from '../state/binding';

export function createSkyEntity(store?: StateStore): SceneEntity {
  return {
    id: 'sky',

    onAttach(scene: SceneHandle, disposer?: Disposer) {
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
      const skyMat = createSkyMaterial();
      const sky = new THREE.Mesh(skyGeo, skyMat.raw);
      scene.add(new SceneObject(sky));
      disposer?.add(skyGeo);
      disposer?.add(skyMat.raw);
      disposer?.add(sky);

      const ringGeo = new THREE.CylinderGeometry(860, 860, 140, 32, 1, true);
      const ringMat = createRingMaterial();
      const ring = new THREE.Mesh(ringGeo, ringMat.raw);
      ring.position.y = -65;
      scene.add(new SceneObject(ring));
      disposer?.add(ringGeo);
      disposer?.add(ringMat.raw);
      disposer?.add(ring);

      if (store && disposer) {
        const binding = new EntityStateBinding(
          store,
          'environment.sky',
          (cfg: any) => {
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
          }
        );
        binding.attach(disposer);
      }
    },

    onDetach() {},
  };
}
