import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';

export function createOrbitControls(camera: THREE.PerspectiveCamera, domElement: HTMLCanvasElement): OrbitControls {
  const controls = new OrbitControls(camera, domElement);
  controls.target.set(0, 10, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;
  controls.minDistance = 35;
  controls.maxDistance = 420;
  controls.update();
  return controls;
}
