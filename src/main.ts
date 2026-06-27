import * as THREE from 'three';
import { Kernel } from './kernel';
import { createOceanEntity, createSkyEntity, createLightingEntity, createSprayEntity, createWakeEntity, createShipEntity, createInstanceManager, entityManager } from './entity';
import { GlbLoader, ModelLoaderImpl, ModelCatalogReader, WorldLoader } from './loaders';
import { northSea } from './worlds';
import { LOCATION_PRESETS } from './state/worlds';
import { inspectorPlugin } from './plugins/inspector';
import { gizmosPlugin } from './plugins/gizmos';
import { snapshotPlugin } from './plugins/snapshot';
import { locationSwitcherPlugin } from './plugins/location-switcher';
import { simulationPlugin } from './plugins/simulation';
import { modeTogglePlugin } from './plugins/mode-toggle';

async function main() {
  const kernel = new Kernel();
  kernel.registerPlugin(inspectorPlugin);
  kernel.registerPlugin(gizmosPlugin);
  kernel.registerPlugin(snapshotPlugin);
  kernel.registerPlugin(locationSwitcherPlugin);
  kernel.registerPlugin(simulationPlugin);
  kernel.registerPlugin(modeTogglePlugin);
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

  const shipEntry = worldResult.entries.find(e => e.model.id === 'ship');
  if (shipEntry) {
    entityManager.attach(createShipEntity(shipEntry.model, store), scene);
  }

  const allRefs = new Set<string>();
  for (const preset of Object.values(LOCATION_PRESETS)) {
    for (const def of Object.values(preset.instances)) {
      allRefs.add(def.ref);
    }
  }
  await modelLoader.preload(Array.from(allRefs));
  entityManager.attach(createInstanceManager(modelLoader, scene, store), scene);

  entityManager.attach(createOceanEntity(store), scene);
  entityManager.attach(createSkyEntity(store), scene);
  entityManager.attach(createLightingEntity(store), scene);
  entityManager.attach(createSprayEntity(), scene);
  entityManager.attach(createWakeEntity(), scene);

  await kernel.init();
  kernel.startLoop();
}

main().catch(console.error);
