import * as THREE from 'three';
import type { SceneEntity, SceneHandle } from '../types';
import { SceneObject } from '../../scene/object';
import type { Disposer } from '../../util/disposer';
import type { StateStore } from '../../state/store';
import { EntityStateBinding } from '../../state/binding';

export function createLightingEntity(store?: StateStore): SceneEntity {
  return {
    id: 'lighting',

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      const sun = new THREE.DirectionalLight(0xfff0d0, 2.8);
      sun.position.set(90, 130, -55);
      sun.castShadow = true;
      sun.shadow.mapSize.set(3072, 3072);
      sun.shadow.radius = 4;
      const sc = sun.shadow.camera;
      sc.left = sc.bottom = -120;
      sc.right = sc.top = 120;
      sc.far = 500;
      sun.shadow.bias = -0.0004;
      sun.shadow.normalBias = 0.02;
      scene.add(new SceneObject(sun));
      disposer?.add(sun);
      disposer?.add(() => { if (sun.shadow?.map) sun.shadow.map.dispose(); });

      const hemi = new THREE.HemisphereLight(0x90c0e0, 0x306080, 1.0);
      scene.add(new SceneObject(hemi));
      disposer?.add(hemi);

      const fill = new THREE.DirectionalLight(0x6090d0, 0.55);
      fill.position.set(-70, -18, 85);
      scene.add(new SceneObject(fill));
      disposer?.add(fill);

      const stern = new THREE.PointLight(0xffcc66, 0.6, 80);
      stern.position.set(0, 18, -35);
      scene.add(new SceneObject(stern));
      disposer?.add(stern);

      const deckGlow = new THREE.PointLight(0xc89a50, 0.25, 50);
      deckGlow.position.set(0, 10, 0);
      scene.add(new SceneObject(deckGlow));
      disposer?.add(deckGlow);

      if (store && disposer) {
        const binding = new EntityStateBinding(
          store,
          'environment.lighting',
          (cfg: any) => {
            sun.visible = cfg.sun.enabled;
            sun.intensity = cfg.sun.intensity;
            sun.color.set(cfg.sun.color);
            const a = cfg.sun.azimuth, e = cfg.sun.elevation;
            sun.position.set(90 * Math.cos(e) * Math.sin(a), 130 * Math.sin(e), -55 * Math.cos(e) * Math.cos(a));

            hemi.visible = cfg.hemisphere.enabled;
            hemi.intensity = cfg.hemisphere.intensity;
            hemi.color.set(cfg.hemisphere.skyColor);
            hemi.groundColor.set(cfg.hemisphere.groundColor);

            fill.visible = cfg.fill.enabled;
            fill.intensity = cfg.fill.intensity;
            fill.color.set(cfg.fill.color);

            if (cfg.pointLights[0]) {
              stern.visible = cfg.pointLights[0].enabled;
              stern.intensity = cfg.pointLights[0].intensity;
              stern.color.set(cfg.pointLights[0].color);
            }
            if (cfg.pointLights[1]) {
              deckGlow.visible = cfg.pointLights[1].enabled;
              deckGlow.intensity = cfg.pointLights[1].intensity;
              deckGlow.color.set(cfg.pointLights[1].color);
            }
          }
        );
        binding.attach(disposer);
      }
    },

    onDetach() {},
  };
}
