import * as THREE from 'three';
import { Kernel } from './kernel';
import { createOceanEntity, createSkyEntity, createLightingEntity, createSprayEntity, createWakeEntity, createShipEntity, entityManager } from './entity';
import { GlbLoader, ModelLoaderImpl, ModelCatalogReader, WorldLoader } from './loaders';
import { northSea } from './worlds';

async function main() {
  const kernel = new Kernel();
  const { scene } = kernel;

  let manifest: Record<string, any> = {};
  try {
    const resp = await fetch('/models/manifest.json');
    manifest = await resp.json();
  } catch {
    console.warn('manifest.json not loaded');
  }

  const glbLoader = new GlbLoader();
  const catalog = new ModelCatalogReader(manifest);
  const modelLoader = new ModelLoaderImpl(glbLoader, catalog);
  const worldLoader = new WorldLoader();
  const worldResult = await worldLoader.load(northSea, modelLoader);

  for (const { model } of worldResult.entries) {
    if (model.id === 'ship') {
      entityManager.attach(createShipEntity(model), scene);
    } else {
      entityManager.attach({
        id: model.id,
        onAttach(s: THREE.Scene) { s.add(model.root); },
        onUpdate() {},
        onDetach() { model.dispose(); },
      }, scene);
    }
  }

  entityManager.attach(createOceanEntity(), scene);
  entityManager.attach(createSkyEntity(), scene);
  entityManager.attach(createLightingEntity(), scene);
  entityManager.attach(createSprayEntity(), scene);
  entityManager.attach(createWakeEntity(), scene);

  await kernel.init();
  kernel.startLoop();
}

main().catch(console.error);
