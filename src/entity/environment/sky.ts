import * as THREE from 'three';
import type { SceneEntity, SceneHandle } from '../types';
import type { IScene } from '../../scene/types';
import type { Disposer } from '../../util/disposer';
import type { StateStore } from '../../state/store';
import { createSkyMaterial, createRingMaterial } from '../../rendering/materials';
import { EntityStateBinding } from '../../state/binding';

export function createSkyEntity(store?: StateStore): SceneEntity {
  return {
    id: 'sky',

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      const s = scene as IScene;
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
      const sky = s.createMesh(skyGeo, skyMat);
      scene.add(sky);
      disposer?.add(skyGeo);
      disposer?.add(() => skyMat.dispose());
      disposer?.add(() => sky.dispose());

      const ringGeo = new THREE.CylinderGeometry(860, 860, 140, 32, 1, true);
      const ringMat = createRingMaterial();
      const ring = s.createMesh(ringGeo, ringMat);
      ring.position.y = -65;
      scene.add(ring);
      disposer?.add(ringGeo);
      disposer?.add(() => ringMat.dispose());
      disposer?.add(() => ring.dispose());

      if (store && disposer) {
        const applySky = (cfg: any) => {
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
          s.background = new THREE.Color(cfg.gradientBottom)
            .lerp(new THREE.Color(cfg.gradientTop), 0.5)
            .getStyle();
        };
        applySky((store as any).get('environment.sky'));
        new EntityStateBinding(store, 'environment.sky', applySky).attach(disposer);

        const applyFog = (cfg: any) => {
          s.fog = { type: cfg.type, color: cfg.color, density: cfg.density };
        };
        applyFog((store as any).get('environment.fog'));
        new EntityStateBinding(store, 'environment.fog', applyFog).attach(disposer);
      }
    },

    onDetach() {},
  };
}
