import * as THREE from 'three';
import type { SceneEntity } from './types';

export function createLightingEntity(): SceneEntity {
  const lights: THREE.Object3D[] = [];

  return {
    id: 'lighting',

    onAttach(scene: THREE.Scene) {
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
      scene.add(sun);
      lights.push(sun);

      const hemi = new THREE.HemisphereLight(0x90c0e0, 0x306080, 1.0);
      scene.add(hemi);
      lights.push(hemi);

      const fill = new THREE.DirectionalLight(0x6090d0, 0.55);
      fill.position.set(-70, -18, 85);
      scene.add(fill);
      lights.push(fill);

      const stern = new THREE.PointLight(0xffcc66, 0.6, 80);
      stern.position.set(0, 18, -35);
      scene.add(stern);
      lights.push(stern);

      const deckGlow = new THREE.PointLight(0xc89a50, 0.25, 50);
      deckGlow.position.set(0, 10, 0);
      scene.add(deckGlow);
      lights.push(deckGlow);
    },

    onUpdate(_dt: number) {},

    onDetach() {
      for (const light of lights) {
        light.removeFromParent();
        if (light instanceof THREE.DirectionalLight) {
          if (light.shadow?.map) light.shadow.map.dispose();
        }
      }
      lights.length = 0;
    },
  };
}
