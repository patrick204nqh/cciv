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
import * as THREE from 'three';

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

  const setFog = (cfg: { type: string; color: string; density: number }) => {
    if (cfg.type === 'exp2') {
      scene.fog = new THREE.FogExp2(new THREE.Color(cfg.color), cfg.density);
    } else {
      scene.fog = new THREE.Fog(new THREE.Color(cfg.color), 0, 2000);
    }
  };
  const initialFog = store.get('environment.fog') as any;
  setFog(initialFog);
  store.subscribe('environment.fog', (v) => setFog(v as any));

  const setBackground = (cfg: { gradientTop: string; gradientBottom: string }) => {
    const c = new THREE.Color(cfg.gradientBottom).lerp(new THREE.Color(cfg.gradientTop), 0.5);
    scene.background = c;
  };
  const initialSky = store.get('environment.sky') as any;
  setBackground(initialSky);
  store.subscribe('environment.sky', (v) => setBackground(v as any));

  kernel.startLoop();
}

main().catch(console.error);
