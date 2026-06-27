import * as THREE from 'three';
import { createOrbitControls } from './controls/orbitControls';
import { modelRegistry } from './model/registry';
import { entityManager } from './entity';
import { createOceanEntity, createSkyEntity, createLightingEntity, createSprayEntity, createWakeEntity, createShipEntity } from './entity';
import { northSea } from './worlds';
import { WorldLoader, ModelLoaderImpl, ModelCatalogReader, GlbLoader } from './loaders';

async function main() {
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

  // Load world from manifest
  let manifest: Record<string, any> = {};
  try {
    const resp = await fetch('/models/manifest.json');
    manifest = await resp.json();
  } catch {
    console.warn('manifest.json not loaded, using empty catalog');
  }

  const glbLoader = new GlbLoader();
  const catalog = new ModelCatalogReader(manifest);
  const modelLoader = new ModelLoaderImpl(glbLoader, catalog);
  const worldLoader = new WorldLoader();

  const worldResult = await worldLoader.load(northSea, scene, modelLoader);
  for (const entity of worldResult.entities) {
    entityManager.attach(entity, scene);
  }

  // Get the ship model for the ship entity (wave interaction)
  const shipModel = modelLoader.getCached('ship');
  if (shipModel) {
    entityManager.attach(createShipEntity(shipModel), scene);
  }

  // Always attach environment entities
  entityManager.attach(createOceanEntity(), scene);
  entityManager.attach(createSkyEntity(), scene);
  entityManager.attach(createLightingEntity(), scene);
  entityManager.attach(createSprayEntity(), scene);
  entityManager.attach(createWakeEntity(), scene);

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  let prevTime = performance.now();

  (function loop() {
    requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min((now - prevTime) / 1000, 0.05);
    prevTime = now;

    entityManager.update(dt);
    controls.update();
    renderer.render(scene, camera);
  })();
}

main().catch(console.error);
