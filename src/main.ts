import * as THREE from 'three';
import { createShip } from './ship';
import { buildEnvironment, updateOcean } from './environment';
import { setupLighting } from './environment/lighting';
import { sampleOcean, sampleNormal } from './environment/waves';
import { initSpray, updateSpray } from './environment/spray';
import { buildWake } from './environment/wake';
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
scene.fog = new THREE.FogExp2(0x406888, 0.0018);
scene.background = new THREE.Color(0x5080a0);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.5, 2000);
camera.position.set(140, 65, -90);

const controls = createOrbitControls(camera, renderer.domElement);

const ship = createShip();
scene.add(ship);

const { ocean, basePos } = buildEnvironment(scene);
const spray = initSpray(scene);
const wake = buildWake();
scene.add(wake);

setupLighting(scene);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const shipPos = new THREE.Vector3();
const shipQuat = new THREE.Quaternion();
let t = 0;
let prevTime = performance.now();

(function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const dt = Math.min((now - prevTime) / 1000, 0.05);
  prevTime = now;
  t += 0.007;

  updateOcean(ocean, basePos, t);

  ship.getWorldPosition(shipPos);
  const { height: waveY } = sampleOcean(shipPos.x, shipPos.z, t);
  const n = sampleNormal(shipPos.x, shipPos.z, t);

  ship.position.y = -1.5 + waveY;
  ship.rotation.x = Math.atan2(n.z, n.y) * 0.5;
  ship.rotation.z = -Math.atan2(n.x, n.y) * 0.5;

  ship.getWorldQuaternion(shipQuat);

  const stern = new THREE.Vector3(0, 0, -56).applyQuaternion(shipQuat).add(shipPos);
  wake.position.copy(stern);
  wake.position.y = -0.35;
  wake.quaternion.copy(shipQuat);

  updateSpray(spray, shipPos, shipQuat, dt);

  controls.update();
  renderer.render(scene, camera);
})();
