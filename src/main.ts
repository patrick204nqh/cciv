import { Kernel } from './kernel';
import { entityManager } from './entity/manager';
import { GlbLoader, ModelLoaderImpl, ModelCatalogReader, WorldLoader } from './loaders';
import { createInstanceManager } from './entity/instances/manager';
import { LOCATION_PRESETS, CCIV_WORLD } from './state/worlds';
import { inspectorPlugin } from './plugins/inspector';
import { gizmosPlugin } from './plugins/gizmos';
import { snapshotPlugin } from './plugins/snapshot';
import { simulationPlugin } from './plugins/simulation';
import { modeTogglePlugin } from './plugins/mode-toggle';
import { sceneGraphPlugin } from './plugins/scene-graph';
import { performanceHudPlugin } from './plugins/performance-hud';
import { shipHudPlugin } from './plugins/ship-hud';
import { environmentControllerPlugin, initEnvController } from './plugins/environment-controller';
import { physicsDebugPlugin } from './plugins/physics-debug';
import { environmentEditorPlugin } from './plugins/environment-editor';
import { mountReactShell } from './ui/main';
import { bridgeStore } from './ui/bridge';
async function main() {
  const canvasContainer = mountReactShell();
  const kernel = new Kernel({ container: canvasContainer });
  kernel.registerPlugin(inspectorPlugin);
  kernel.registerPlugin(gizmosPlugin);
  kernel.registerPlugin(snapshotPlugin);
  kernel.registerPlugin(simulationPlugin);
  kernel.registerPlugin(modeTogglePlugin);
  kernel.registerPlugin(sceneGraphPlugin);
  kernel.registerPlugin(performanceHudPlugin);
  kernel.registerPlugin(shipHudPlugin);
  kernel.registerPlugin(physicsDebugPlugin);
  kernel.registerPlugin(environmentEditorPlugin);
  kernel.registerPlugin(environmentControllerPlugin);
  initEnvController(kernel.scene);
  const { scene, store } = kernel;

  let manifest: Record<string, any> = {};
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}models/manifest.json`);
    manifest = await resp.json();
  } catch {
    console.warn('manifest.json not loaded');
  }

  const glbLoader = new GlbLoader();
  const catalog = new ModelCatalogReader(manifest);
  const modelLoader = new ModelLoaderImpl(glbLoader, catalog);
  const worldLoader = new WorldLoader();

  const worldConfig = LOCATION_PRESETS[CCIV_WORLD.locations[0]];
  const { entities } = await worldLoader.load(worldConfig, modelLoader, store);
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

  bridgeStore.getState().setPluginCtx(kernel.createPluginContext());

  await kernel.startLoop();
}

main().catch(console.error);
