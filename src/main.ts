import * as THREE from 'three';
import { createOrbitControls } from './controls/orbitControls';
import { worldClock } from './time';
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

  // Load manifest
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

  // Load world models (does not add to scene — entities own placement)
  const worldResult = await worldLoader.load(northSea, modelLoader);

  // Attach model entities — each entity owns its scene placement.
  // Ship gets a specialized entity for wave interaction; all others get a generic lifecycle entity.
  for (const { model } of worldResult.entries) {
    if (model.id === 'ship') {
      entityManager.attach(createShipEntity(model), scene);
    } else {
      const entity: import('./entity/types').SceneEntity = {
        id: model.id,
        onAttach(s: THREE.Scene) { s.add(model.root); },
        onUpdate() {},
        onDetach() { model.dispose(); },
      };
      entityManager.attach(entity, scene);
    }
  }

  // Environment entities
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

    worldClock.update(dt);
    entityManager.update(dt);
    controls.update();
    renderer.render(scene, camera);
  })();
}

main().catch(console.error);
