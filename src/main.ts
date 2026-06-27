import * as THREE from 'three';
import { Kernel } from './kernel';
import { createOceanEntity, createSkyEntity, createLightingEntity, createSprayEntity, createWakeEntity, createShipEntity, entityManager } from './entity';
import { GlbLoader, ModelLoaderImpl, ModelCatalogReader, WorldLoader } from './loaders';
import { northSea } from './worlds';
import { inspectorPlugin } from './plugins/inspector';
import { gizmosPlugin } from './plugins/gizmos';
import { snapshotPlugin } from './plugins/snapshot';

async function main() {
  const kernel = new Kernel();
  kernel.registerPlugin(inspectorPlugin);
  kernel.registerPlugin(gizmosPlugin);
  kernel.registerPlugin(snapshotPlugin);
  const { scene, store } = kernel;

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
      entityManager.attach(createShipEntity(model, store), scene);
    } else {
      entityManager.attach({
        id: model.id,
        onAttach(s: THREE.Scene) { s.add(model.root); },
        onUpdate() {},
        onDetach() { model.dispose(); },
      }, scene);
    }
  }

  entityManager.attach(createOceanEntity(store), scene);
  entityManager.attach(createSkyEntity(store), scene);
  entityManager.attach(createLightingEntity(store), scene);
  entityManager.attach(createSprayEntity(), scene);
  entityManager.attach(createWakeEntity(), scene);

  await kernel.init();
  kernel.startLoop();
}

main().catch(console.error);
