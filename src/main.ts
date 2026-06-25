import * as THREE from 'three';
import { createShip } from './ship';
import { buildEnvironment } from './environment';
import { setupLighting } from './environment/lighting';
import { createOrbitControls } from './controls/orbitControls';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a1828, 0.0032);
scene.background = new THREE.Color(0x0e1c2a);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.5, 2000);
camera.position.set(140, 65, -90);

const controls = createOrbitControls(camera, renderer.domElement);

const ship = createShip();
scene.add(ship);

buildEnvironment(scene);
setupLighting(scene);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let t = 0;
(function loop() {
  requestAnimationFrame(loop);
  t += 0.007;
  ship.position.y = Math.sin(t * 0.65) * 0.18;
  ship.rotation.z = Math.sin(t * 0.48) * 0.009;
  ship.rotation.x = Math.sin(t * 0.37 + 1) * 0.005;
  controls.update();
  renderer.render(scene, camera);
})();
