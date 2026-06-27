import { Kernel } from './kernel';
import { entityManager } from './entity/manager';
import { GlbLoader, ModelLoaderImpl, ModelCatalogReader, WorldLoader } from './loaders';
import { createInstanceManager } from './entity/instance-manager';
import { LOCATION_PRESETS, CCIV_WORLD } from './state/worlds';
import { inspectorPlugin } from './plugins/inspector';
import { gizmosPlugin } from './plugins/gizmos';
import { snapshotPlugin } from './plugins/snapshot';
import { locationSwitcherPlugin } from './plugins/location-switcher';
import { simulationPlugin } from './plugins/simulation';
import { modeTogglePlugin } from './plugins/mode-toggle';
import { sceneGraphPlugin } from './plugins/scene-graph';
import { performanceHudPlugin } from './plugins/performance-hud';
import { shipHudPlugin } from './plugins/ship-hud';

async function main() {
  const kernel = new Kernel();
  kernel.registerPlugin(inspectorPlugin);
  kernel.registerPlugin(gizmosPlugin);
  kernel.registerPlugin(snapshotPlugin);
  kernel.registerPlugin(locationSwitcherPlugin);
  kernel.registerPlugin(simulationPlugin);
  kernel.registerPlugin(modeTogglePlugin);
  kernel.registerPlugin(sceneGraphPlugin);
  kernel.registerPlugin(performanceHudPlugin);
  kernel.registerPlugin(shipHudPlugin);
  const { scene, store } = kernel;

  let manifest: Record<string, any> = {};
  try {
    const resp = await fetch(new URL('models/manifest.json', import.meta.env.BASE_URL).href);
    manifest = await resp.json();
  } catch {
    console.warn('manifest.json not loaded');
  }

  const glbLoader = new GlbLoader();
  const catalog = new ModelCatalogReader(manifest);
  const modelLoader = new ModelLoaderImpl(glbLoader, catalog);
  const worldLoader = new WorldLoader();

  const worldConfig = LOCATION_PRESETS[CCIV_WORLD.locations[0]];
  const { entities } = await worldLoader.load(worldConfig, modelLoader);
  for (const entity of entities) {
    entityManager.attach(entity, scene);
  }

  const allRefs = new Set<string>();
  for (const preset of Object.values(LOCATION_PRESETS)) {
    for (const def of Object.values(preset.instances)) {
      allRefs.add(def.ref);
    }
  }
  await modelLoader.preload(Array.from(allRefs));
  entityManager.attach(createInstanceManager(modelLoader, scene, store), scene);

  await kernel.init();
  kernel.startLoop();
}

main().catch(console.error);
