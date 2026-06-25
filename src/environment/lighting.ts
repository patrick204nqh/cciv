import * as THREE from 'three';

export function setupLighting(scene: THREE.Scene): void {
  const sun = new THREE.DirectionalLight(0xfff0d0, 2.8);
  sun.position.set(90, 130, -55); sun.castShadow = true;
  sun.shadow.mapSize.set(3072, 3072);
  sun.shadow.radius = 4;
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -120; sc.right = sc.top = 120; sc.far = 500;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x90c0e0, 0x306080, 1.0));
  const fill = new THREE.DirectionalLight(0x6090d0, 0.55);
  fill.position.set(-70, -18, 85); scene.add(fill);
  const stern = new THREE.PointLight(0xffcc66, 0.6, 80);
  stern.position.set(0, 18, -35); scene.add(stern);
  const deckGlow = new THREE.PointLight(0xc89a50, 0.25, 50);
  deckGlow.position.set(0, 10, 0); scene.add(deckGlow);
}
