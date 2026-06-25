import * as THREE from 'three';

export function setupLighting(scene: THREE.Scene): void {
  const sun = new THREE.DirectionalLight(0xffe8b0, 2.1);
  sun.position.set(90, 130, -55); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -120; sc.right = sc.top = 120; sc.far = 500;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x8ab8d8, 0x1a3040, 0.72));
  const fill = new THREE.DirectionalLight(0x3060a0, 0.38);
  fill.position.set(-70, -18, 85); scene.add(fill);
  const stern = new THREE.PointLight(0xffcc66, 0.6, 80);
  stern.position.set(0, 18, -35); scene.add(stern);
}
