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
    scene.fog = { type: cfg.type as 'exp2' | 'linear', color: cfg.color, density: cfg.density };
  };
  const initialFog = store.get('environment.fog') as any;
  setFog(initialFog);
  store.subscribe('environment.fog', (v) => setFog(v as any));

  function lerpHex(a: string, b: string, t: number): string {
    const ar = parseInt(a.slice(1), 16), br = parseInt(b.slice(1), 16);
    const r = Math.round(((ar >> 16) & 0xff) * (1 - t) + ((br >> 16) & 0xff) * t);
    const g = Math.round(((ar >> 8) & 0xff) * (1 - t) + ((br >> 8) & 0xff) * t);
    const bl = Math.round((ar & 0xff) * (1 - t) + (br & 0xff) * t);
    return `#${(r << 16 | g << 8 | bl).toString(16).padStart(6, '0')}`;
  }
  const setBackground = (cfg: { gradientTop: string; gradientBottom: string }) => {
    scene.background = lerpHex(cfg.gradientBottom, cfg.gradientTop, 0.5);
  };
  const initialSky = store.get('environment.sky') as any;
  setBackground(initialSky);
  store.subscribe('environment.sky', (v) => setBackground(v as any));

  kernel.startLoop();
}

main().catch(console.error);
