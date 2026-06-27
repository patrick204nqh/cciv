# Engineering Workbench MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Engineering Workbench MVP — state store, plugin system, inspector, gizmos, snapshot, and location switching — turning the CCIV scene into an interactive engineer workbench.

**Architecture:** Plugin-based system on top of a Kernel that owns scene, renderer, camera, controls, and a reactive state store. Plugins register per-mode (edit/play). The state store is the single source of truth; entities subscribe to state paths. Worlds are collections of locations; each location bundles environment + instance presets.

**Tech Stack:** TypeScript, Three.js (r174), vitest, lil-gui

## Global Constraints

- No new runtime dependencies beyond three, lil-gui
- Follow existing codebase patterns (SceneEntity, factory functions, Disposer)
- Coordinate convention: Y-up, Z-bow(+), X-starboard(-)
- Existing entity files should be modified minimally — prefer additive changes

---

## File Structure

### New files
```
src/state/types.ts              — AppState, EnvironmentState, InstanceState, LocationPreset, WorldDef
src/state/defaults.ts           — createDefaultState() factory
src/state/store.ts              — StateStore class (get/set/subscribe/snapshot/restore)
src/state/worlds.ts             — CCIV world definition with north-sea location preset
src/plugins/types.ts            — ScenePlugin, Kernel interfaces
src/plugins/registry.ts         — PluginRegistry class
src/kernel.ts                   — Kernel class (owns scene, renderer, camera, controls, store, registry, mode)
src/plugins/inspector/index.ts  — lil-gui panel bound to state store
src/plugins/gizmos/index.ts     — TransformControls wrapper
src/plugins/snapshot/index.ts   — JSON save/load
src/plugins/location-switcher/index.ts — Location dropdown + crossfade transition
```

### Modified files
```
src/main.ts                     — Bootstrap Kernel instead of raw setup
src/entity/ship-entity.ts       — Accept store, subscribe to instances.ship paths
src/entity/lighting-entity.ts   — Accept store, subscribe to environment.lighting paths
src/entity/sky-entity.ts        — Accept store, subscribe to environment.sky paths
src/entity/ocean-entity.ts      — Accept store, subscribe to environment.ocean paths
src/worlds/types.ts             — Add WorldDef + WorldCollection types
```

---

### Task 1: State Types & Defaults

**Files:**
- Create: `src/state/types.ts`
- Create: `src/state/defaults.ts`
- Create: `src/state/defaults.test.ts`

- [ ] **Step 1: Create `src/state/types.ts`**

```ts
export interface EnvironmentState {
  sky: {
    gradientTop: string
    gradientBottom: string
    horizonOffset: number
  }
  waves: {
    speed: number
    amplitude: number
    frequency: number
    steepness: number
  }[]
  ocean: {
    color: string
    opacity: number
    gridSize: number
    extent: number
  }
  lighting: {
    sun: { enabled: boolean; intensity: number; color: string; azimuth: number; elevation: number }
    hemisphere: { enabled: boolean; skyColor: string; groundColor: string; intensity: number }
    fill: { enabled: boolean; intensity: number; color: string }
    pointLights: { enabled: boolean; intensity: number; color: string; position: [number, number, number]; range: number }[]
  }
  fog: { type: 'exp2' | 'linear'; color: string; density: number }
}

export interface MaterialOverride {
  color: string
  roughness: number
  metalness: number
  visible: boolean
}

export interface ShipInstanceState {
  transform: { position: [number, number, number]; rotation: [number, number, number]; scale: number }
  material: Record<string, MaterialOverride>
  visible: boolean
}

export interface InstanceState {
  ship: ShipInstanceState
  buoys: { id: string; transform: { position: [number, number, number]; rotation: [number, number, number]; scale: number }; visible: boolean }[]
  island: { transform: { position: [number, number, number]; rotation: [number, number, number]; scale: number }; visible: boolean }
}

export interface LocationPreset {
  environment: EnvironmentState
  instances: InstanceState
}

export interface AppState {
  activeLocation: string
  time: { speed: number; paused: boolean; elapsed: number }
  environment: EnvironmentState
  instances: InstanceState
  locations: Record<string, LocationPreset>
}
```

- [ ] **Step 2: Write failing test for defaults**

```ts
// src/state/defaults.test.ts
import { describe, it, expect } from 'vitest';
import { createDefaultState } from './defaults';

describe('createDefaultState', () => {
  it('returns a valid AppState', () => {
    const state = createDefaultState();
    expect(state.activeLocation).toBe('north-sea');
    expect(state.environment.sky.gradientTop).toBeTruthy();
    expect(state.environment.waves.length).toBe(8);
    expect(state.instances.ship.visible).toBe(true);
    expect(Object.keys(state.locations)).toContain('north-sea');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/state/defaults.test.ts --reporter=verbose`
Expected: FAIL — "Cannot find module './defaults'"

- [ ] **Step 4: Create `src/state/defaults.ts`**

```ts
import type { AppState, EnvironmentState, InstanceState, MaterialOverride, LocationPreset } from './types';

const defaultMaterial = (color: string, roughness: number, metalness: number): MaterialOverride => ({
  color, roughness, metalness, visible: true,
});

const defaultEnvironment = (): EnvironmentState => ({
  sky: { gradientTop: '#5588bb', gradientBottom: '#87ceeb', horizonOffset: 0 },
  waves: [
    { speed: 1, amplitude: 1.4, frequency: 0.157, steepness: 0.45 },
    { speed: 1, amplitude: 0.9, frequency: 0.251, steepness: 0.45 },
    { speed: 1, amplitude: 0.6, frequency: 0.349, steepness: 0.45 },
    { speed: 1, amplitude: 0.5, frequency: 0.524, steepness: 0.45 },
    { speed: 1, amplitude: 0.3, frequency: 0.785, steepness: 0.45 },
    { speed: 1, amplitude: 0.25, frequency: 1.047, steepness: 0.45 },
    { speed: 1, amplitude: 0.4, frequency: 0.419, steepness: 0.45 },
    { speed: 1, amplitude: 0.35, frequency: 0.628, steepness: 0.45 },
  ],
  ocean: { color: '#2090d0', opacity: 0.82, gridSize: 80, extent: 1800 },
  lighting: {
    sun: { enabled: true, intensity: 2.8, color: '#fff0d0', azimuth: 0.8, elevation: 1.2 },
    hemisphere: { enabled: true, skyColor: '#90c0e0', groundColor: '#306080', intensity: 1.0 },
    fill: { enabled: true, intensity: 0.55, color: '#6090d0' },
    pointLights: [
      { enabled: true, intensity: 0.6, color: '#ffcc66', position: [0, 18, -35], range: 80 },
      { enabled: true, intensity: 0.25, color: '#c89a50', position: [0, 10, 0], range: 50 },
    ],
  },
  fog: { type: 'exp2', color: '#406888', density: 0.0018 },
});

const defaultInstances = (): InstanceState => ({
  ship: {
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
    material: {
      hull: defaultMaterial('#3b2818', 0.92, 0),
      deck: defaultMaterial('#887050', 0.88, 0),
      sails: defaultMaterial('#f5edd9', 1, 0),
      aft: defaultMaterial('#3b2818', 0.85, 0),
      rigging: defaultMaterial('#3a2818', 0.9, 0),
      details: defaultMaterial('#2e1c0c', 0.9, 0),
      interior: defaultMaterial('#1a1008', 0.95, 0),
    },
    visible: true,
  },
  buoys: [
    { id: 'buoy-1', transform: { position: [60, 0, 35], rotation: [0, 0, 0], scale: 1 }, visible: true },
    { id: 'buoy-2', transform: { position: [-55, 0, -25], rotation: [0, 0, 0], scale: 1 }, visible: true },
  ],
  island: { transform: { position: [-200, 0, -150], rotation: [0, 0, 0], scale: 1 }, visible: true },
});

export function createDefaultState(): AppState {
  const env = defaultEnvironment();
  const instances = defaultInstances();
  return {
    activeLocation: 'north-sea',
    time: { speed: 1, paused: false, elapsed: 0 },
    environment: env,
    instances,
    locations: {
      'north-sea': { environment: env, instances },
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/state/defaults.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/state/types.ts src/state/defaults.ts src/state/defaults.test.ts
git commit -m "feat: add state types and defaults"
```

---

### Task 2: State Store

**Files:**
- Create: `src/state/store.ts`
- Create: `src/state/store.test.ts`

- [ ] **Step 1: Write failing tests for StateStore**

```ts
// src/state/store.test.ts
import { describe, it, expect, vi } from 'vitest';
import { StateStore } from './store';
import { createDefaultState } from './defaults';

describe('StateStore', () => {
  it('returns current state via get()', () => {
    const store = new StateStore(createDefaultState());
    expect(store.get('activeLocation')).toBe('north-sea');
  });

  it('sets a value and notifies subscribers', () => {
    const store = new StateStore(createDefaultState());
    const fn = vi.fn();
    store.subscribe('activeLocation', fn);
    store.set('activeLocation', 'caribbean');
    expect(fn).toHaveBeenCalledWith('caribbean', 'activeLocation');
  });

  it('sets a nested dotted path', () => {
    const store = new StateStore(createDefaultState());
    const fn = vi.fn();
    store.subscribe('environment.sky.gradientTop', fn);
    store.set('environment.sky.gradientTop', '#ff0000');
    expect(fn).toHaveBeenCalledWith('#ff0000', 'environment.sky.gradientTop');
  });

  it('notifies subscribers on parent paths', () => {
    const store = new StateStore(createDefaultState());
    const fn = vi.fn();
    store.subscribe('instances.ship.transform', fn);
    store.set('instances.ship.transform.position', [10, 0, 0]);
    expect(fn).toHaveBeenCalled();
  });

  it('takes a snapshot', () => {
    const store = new StateStore(createDefaultState());
    const snap = store.snapshot();
    expect(snap.activeLocation).toBe('north-sea');
  });

  it('restores a snapshot', () => {
    const store = new StateStore(createDefaultState());
    store.set('activeLocation', 'caribbean');
    const snap = store.snapshot();
    snap.activeLocation = 'north-sea';
    store.restore(snap);
    expect(store.get('activeLocation')).toBe('north-sea');
  });

  it('unsubscribes', () => {
    const store = new StateStore(createDefaultState());
    const fn = vi.fn();
    const unsub = store.subscribe('activeLocation', fn);
    unsub();
    store.set('activeLocation', 'caribbean');
    expect(fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/store.test.ts --reporter=verbose`
Expected: FAIL — "Cannot find module './store'"

- [ ] **Step 3: Create `src/state/store.ts`**

```ts
import type { AppState } from './types';

type Listener = (value: unknown, path: string) => void;

export class StateStore {
  private state: AppState;
  private listeners = new Map<string, Set<Listener>>();

  constructor(initial: AppState) {
    this.state = structuredClone(initial);
  }

  get(): AppState;
  get<K extends keyof AppState>(path: K): AppState[K];
  get(path?: string): unknown {
    if (!path) return this.state;
    const parts = path.split('.');
    let cur: unknown = this.state;
    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return cur;
  }

  set(path: string, value: unknown): void {
    const parts = path.split('.');
    let cur: unknown = this.state;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur && typeof cur === 'object') {
        cur = (cur as Record<string, unknown>)[parts[i]];
      }
    }
    if (cur && typeof cur === 'object') {
      (cur as Record<string, unknown>)[parts[parts.length - 1]] = value;
    }
    this.notify(path, value);
  }

  subscribe(path: string, fn: Listener): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path)!.add(fn);
    return () => { this.listeners.get(path)?.delete(fn); };
  }

  snapshot(): AppState {
    return structuredClone(this.state);
  }

  restore(snapshot: AppState): void {
    const oldKeys = Object.keys(this.state);
    this.state = snapshot;
    for (const key of oldKeys) {
      const v = (this.state as Record<string, unknown>)[key];
      this.notify(key, v);
    }
  }

  private notify(path: string, value: unknown): void {
    for (const [key, fns] of this.listeners) {
      if (path.startsWith(key) || key.startsWith(path)) {
        for (const fn of fns) fn(value, path);
      }
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/state/store.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/store.ts src/state/store.test.ts
git commit -m "feat: add StateStore with dotted-path get/set/subscribe"
```

---

### Task 3: Plugin System + Kernel

**Files:**
- Create: `src/plugins/types.ts`
- Create: `src/plugins/registry.ts`
- Create: `src/plugins/registry.test.ts`
- Create: `src/kernel.ts`
- Create: `src/kernel.test.ts`

- [ ] **Step 1: Create `src/plugins/types.ts`**

```ts
import * as THREE from 'three';
import { StateStore } from '../state/store';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface Kernel {
  readonly scene: THREE.Scene
  readonly renderer: THREE.WebGLRenderer
  readonly camera: THREE.PerspectiveCamera
  readonly controls: OrbitControls
  readonly store: StateStore
  mode: 'edit' | 'play'
  readonly container: HTMLElement
}

export interface ScenePlugin {
  readonly id: string
  readonly label: string
  readonly modes: Set<'edit' | 'play'>
  readonly priority: number
  init(kernel: Kernel): void
  destroy(): void
  onModeSwitch?(from: 'edit' | 'play', to: 'edit' | 'play'): void
  render?(dt: number): void
}
```

- [ ] **Step 2: Create `src/plugins/registry.ts`**

```ts
import type { ScenePlugin } from './types';

export class PluginRegistry {
  private plugins: ScenePlugin[] = [];

  register(plugin: ScenePlugin): void {
    this.plugins.push(plugin);
    this.plugins.sort((a, b) => a.priority - b.priority);
  }

  getAll(): ScenePlugin[] {
    return this.plugins;
  }

  getActive(mode: 'edit' | 'play'): ScenePlugin[] {
    return this.plugins.filter(p => p.modes.has(mode));
  }
}
```

- [ ] **Step 3: Write failing test for registry**

```ts
// src/plugins/registry.test.ts
import { describe, it, expect } from 'vitest';
import { PluginRegistry } from './registry';
import type { ScenePlugin } from './types';

describe('PluginRegistry', () => {
  it('returns active plugins for a mode', () => {
    const reg = new PluginRegistry();
    reg.register({ id: 'a', label: 'A', modes: new Set(['edit']), priority: 0 } as ScenePlugin);
    reg.register({ id: 'b', label: 'B', modes: new Set(['play']), priority: 0 } as ScenePlugin);
    expect(reg.getActive('edit')).toHaveLength(1);
    expect(reg.getActive('play')).toHaveLength(1);
  });

  it('sorts by priority', () => {
    const reg = new PluginRegistry();
    reg.register({ id: 'b', label: 'B', modes: new Set(['edit']), priority: 10 } as ScenePlugin);
    reg.register({ id: 'a', label: 'A', modes: new Set(['edit']), priority: 0 } as ScenePlugin);
    const plugins = reg.getAll();
    expect(plugins[0].id).toBe('a');
  });
});
```

- [ ] **Step 4: Run registry test**

Run: `npx vitest run src/plugins/registry.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Create `src/kernel.ts`**

```ts
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createOrbitControls } from './controls/orbitControls';
import { StateStore } from './state/store';
import { PluginRegistry } from './plugins/registry';
import { createDefaultState } from './state/defaults';
import type { Kernel as KernelInterface, ScenePlugin } from './plugins/types';

export class Kernel implements KernelInterface {
  readonly scene: THREE.Scene
  readonly renderer: THREE.WebGLRenderer
  readonly camera: THREE.PerspectiveCamera
  readonly controls: OrbitControls
  readonly store: StateStore
  readonly registry: PluginRegistry
  readonly container: HTMLElement
  private _mode: 'edit' | 'play' = 'play'
  private initialized = false

  get mode() { return this._mode }
  set mode(m: 'edit' | 'play') {
    const prev = this._mode
    if (prev === m) return
    this._mode = m
    for (const p of this.registry.getAll()) {
      p.onModeSwitch?.(prev, m)
    }
  }

  constructor() {
    this.container = document.body
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x406888, 0.0018)
    this.scene.background = new THREE.Color(0x5080a0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.setSize(innerWidth, innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.5, 2000)
    this.camera.position.set(140, 65, -90)

    this.controls = createOrbitControls(this.camera, this.renderer.domElement)
    this.store = new StateStore(createDefaultState())
    this.registry = new PluginRegistry()
  }

  registerPlugin(plugin: ScenePlugin): void {
    this.registry.register(plugin)
    if (this.initialized && plugin.modes.has(this.mode)) {
      plugin.init(this)
    }
  }

  async init(): Promise<void> {
    for (const p of this.registry.getActive(this.mode)) {
      p.init(this)
    }
    this.initialized = true
    window.addEventListener('resize', this.onResize)
  }

  private onResize = () => {
    this.camera.aspect = innerWidth / innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(innerWidth, innerHeight)
  }

  startLoop(): void {
    let prevTime = performance.now()
    const loop = () => {
      requestAnimationFrame(loop)
      const now = performance.now()
      const dt = Math.min((now - prevTime) / 1000, 0.05)
      prevTime = now

      for (const p of this.registry.getActive(this.mode)) {
        p.render?.(dt)
      }
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
    }
    loop()
  }
}
```

- [ ] **Step 6: Minimal test for Kernel**

```ts
// src/kernel.test.ts
import { describe, it, expect } from 'vitest';
import { Kernel } from './kernel';

describe('Kernel', () => {
  it('creates with default state', () => {
    const k = new Kernel();
    expect(k.mode).toBe('play');
    expect(k.store.get('activeLocation')).toBe('north-sea');
  });

  it('switches mode', () => {
    const k = new Kernel();
    k.mode = 'edit';
    expect(k.mode).toBe('edit');
  });
});
```

- [ ] **Step 7: Run kernel test**

Run: `npx vitest run src/kernel.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/plugins/types.ts src/plugins/registry.ts src/plugins/registry.test.ts src/kernel.ts src/kernel.test.ts
git commit -m "feat: add plugin system + kernel"
```

---

### Task 4: World Presets

**Files:**
- Create: `src/state/worlds.ts`
- Create: `src/state/worlds.test.ts`
- Modify: `src/worlds/types.ts`

- [ ] **Step 1: Add world/location types to `src/worlds/types.ts`**

```ts
// Append to existing file
export interface WorldDef {
  id: string
  label: string
  locations: string[]
}

export interface WorldCollection {
  current: string
  worlds: Record<string, WorldDef>
}
```

- [ ] **Step 2: Create `src/state/worlds.ts` with empty presets**

```ts
import type { LocationPreset } from './types';

export const CCIV_WORLD = {
  id: 'cciv',
  label: 'CCIV',
  locations: ['north-sea'],
};

export const LOCATION_PRESETS: Record<string, LocationPreset> = {};
```

- [ ] **Step 3: Create `src/state/worlds.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { CCIV_WORLD, LOCATION_PRESETS } from './worlds';

describe('world presets', () => {
  it('defines CCIV world with north-sea location', () => {
    expect(CCIV_WORLD.locations).toContain('north-sea');
    expect(LOCATION_PRESETS['north-sea']).toBeDefined();
    expect(LOCATION_PRESETS['north-sea'].environment).toBeDefined();
    expect(LOCATION_PRESETS['north-sea'].instances).toBeDefined();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/state/worlds.test.ts --reporter=verbose`
Expected: FAIL — LOCATION_PRESETS['north-sea'] is undefined

- [ ] **Step 5: Populate LOCATION_PRESETS with north-sea data**

Replace the empty object:
```ts
export const LOCATION_PRESETS: Record<string, LocationPreset> = {
  'north-sea': {
    environment: {
      sky: { gradientTop: '#5588bb', gradientBottom: '#87ceeb', horizonOffset: 0 },
      waves: [
        { speed: 1, amplitude: 1.4, frequency: 0.157, steepness: 0.45 },
        { speed: 1, amplitude: 0.9, frequency: 0.251, steepness: 0.45 },
        { speed: 1, amplitude: 0.6, frequency: 0.349, steepness: 0.45 },
        { speed: 1, amplitude: 0.5, frequency: 0.524, steepness: 0.45 },
        { speed: 1, amplitude: 0.3, frequency: 0.785, steepness: 0.45 },
        { speed: 1, amplitude: 0.25, frequency: 1.047, steepness: 0.45 },
        { speed: 1, amplitude: 0.4, frequency: 0.419, steepness: 0.45 },
        { speed: 1, amplitude: 0.35, frequency: 0.628, steepness: 0.45 },
      ],
      ocean: { color: '#2090d0', opacity: 0.82, gridSize: 80, extent: 1800 },
      lighting: {
        sun: { enabled: true, intensity: 2.8, color: '#fff0d0', azimuth: 0.8, elevation: 1.2 },
        hemisphere: { enabled: true, skyColor: '#90c0e0', groundColor: '#306080', intensity: 1.0 },
        fill: { enabled: true, intensity: 0.55, color: '#6090d0' },
        pointLights: [
          { enabled: true, intensity: 0.6, color: '#ffcc66', position: [0, 18, -35], range: 80 },
          { enabled: true, intensity: 0.25, color: '#c89a50', position: [0, 10, 0], range: 50 },
        ],
      },
      fog: { type: 'exp2', color: '#406888', density: 0.0018 },
    },
    instances: {
      ship: {
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
        material: {
          hull: { color: '#3b2818', roughness: 0.92, metalness: 0, visible: true },
          deck: { color: '#887050', roughness: 0.88, metalness: 0, visible: true },
          sails: { color: '#f5edd9', roughness: 1, metalness: 0, visible: true },
          aft: { color: '#3b2818', roughness: 0.85, metalness: 0, visible: true },
          rigging: { color: '#3a2818', roughness: 0.9, metalness: 0, visible: true },
          details: { color: '#2e1c0c', roughness: 0.9, metalness: 0, visible: true },
          interior: { color: '#1a1008', roughness: 0.95, metalness: 0, visible: true },
        },
        visible: true,
      },
      buoys: [
        { id: 'buoy-1', transform: { position: [60, 0, 35], rotation: [0, 0, 0], scale: 1 }, visible: true },
        { id: 'buoy-2', transform: { position: [-55, 0, -25], rotation: [0, 0, 0], scale: 1 }, visible: true },
      ],
      island: { transform: { position: [-200, 0, -150], rotation: [0, 0, 0], scale: 1 }, visible: true },
    },
  },
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/state/worlds.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/state/worlds.ts src/state/worlds.test.ts src/worlds/types.ts
git commit -m "feat: add world presets with north-sea location"
```

---

### Task 5: Wire main.ts to Kernel

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Rewrite `src/main.ts` to bootstrap Kernel**

```
├── Kernel constructor creates scene, renderer, camera, controls, store
├── Load manifest + world models (same as before, from northSea)
├── Attach model entities to entityManager (same as before)
├── Attach environment entities to entityManager (same as before)
└── kernel.init() + kernel.startLoop()
```

Replace inline setup with Kernel. Entity factories keep current signatures. Also import `* as THREE` so the anonymous entity factory can use `THREE.Scene`.

```ts
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx vite build 2>&1 | head -30`
Expected: Build succeeds

If type errors: fix imports. The main thing is the Kernel constructor already configures scene, renderer, camera, fog, background.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "refactor: wire main.ts to Kernel"
```

---

### Task 6: Wire Entities to State Store

**Files:**
- Modify: `src/entity/ship-entity.ts` — accept `StateStore`, subscribe to material paths
- Modify: `src/entity/lighting-entity.ts` — accept `StateStore`, subscribe to lighting paths
- Modify: `src/entity/sky-entity.ts` — accept `StateStore`, subscribe to sky path
- Modify: `src/entity/ocean-entity.ts` — accept `StateStore`, subscribe to ocean path
- Modify: `src/main.ts` — pass `kernel.store` to entity factories

- [ ] **Step 1: Make `createShipEntity` accept store and subscribe to material overrides**

```ts
import * as THREE from 'three';
import type { SceneEntity } from './types';
import { bus } from '../event-bus';
import type { ModelEntity } from '../model/types';
import { waveSurface } from '../environment/wave-surface';
import type { StateStore } from '../state/store';

export function createShipEntity(model: ModelEntity, store?: StateStore): SceneEntity {
  let prevPos = new THREE.Vector3();
  let prevQuat = new THREE.Quaternion();

  const applyMaterial = (path: string, value: unknown) => {
    const parts = path.split('.');
    // e.g. "instances.ship.material.hull.color" → group "hull", attr "color"
    if (parts.length < 5) return;
    const group = parts[3];
    const attr = parts[4];
    const mesh = model.root.getObjectByName(group) as THREE.Mesh | undefined;
    if (!mesh || !(mesh.material instanceof THREE.MeshStandardMaterial)) return;
    if (attr === 'color') mesh.material.color.set(value as string);
    else if (attr === 'roughness') mesh.material.roughness = value as number;
    else if (attr === 'metalness') mesh.material.metalness = value as number;
    else if (attr === 'visible') mesh.visible = value as boolean;
    mesh.material.needsUpdate = true;
  };

  const unsubs: (() => void)[] = [];

  return {
    id: 'ship',

    onAttach(scene: THREE.Scene) {
      scene.add(model.root);

      if (store) {
        unsubs.push(store.subscribe('instances.ship.material', (v) => {
          const mat = v as Record<string, { color: string; roughness: number; metalness: number; visible: boolean }>;
          for (const [group, overrides] of Object.entries(mat)) {
            const mesh = model.root.getObjectByName(group) as THREE.Mesh | undefined;
            if (!mesh || !(mesh.material instanceof THREE.MeshStandardMaterial)) continue;
            mesh.material.color.set(overrides.color);
            mesh.material.roughness = overrides.roughness;
            mesh.material.metalness = overrides.metalness;
            mesh.visible = overrides.visible;
            mesh.material.needsUpdate = true;
          }
        }));
      }
    },

    onBeforeUpdate(_dt: number) {
      model.root.getWorldPosition(prevPos);
      model.root.getWorldQuaternion(prevQuat);
    },

    onUpdate(_dt: number) {
      const pos = new THREE.Vector3();
      model.root.getWorldPosition(pos);

      const { height: waveY, normal: n } = waveSurface.sample(pos.x, pos.z);

      model.root.position.y = -1.5 + waveY;
      model.root.rotation.x = Math.atan2(n.z, n.y) * 0.5;
      model.root.rotation.z = -Math.atan2(n.x, n.y) * 0.5;

      const newPos = new THREE.Vector3();
      const newQuat = new THREE.Quaternion();
      model.root.getWorldPosition(newPos);
      model.root.getWorldQuaternion(newQuat);

      if (!newPos.equals(prevPos) || !newQuat.equals(prevQuat)) {
        bus.emit('entity:position-changed', {
          entityId: 'ship',
          x: newPos.x, y: newPos.y, z: newPos.z,
          qx: newQuat.x, qy: newQuat.y, qz: newQuat.z, qw: newQuat.w,
        });
      }
    },

    onDetach() {
      unsubs.forEach(fn => fn());
      model.dispose();
    },
  };
}
```

- [ ] **Step 2: Make `createLightingEntity` accept store and subscribe to lighting params**

```ts
// At top of function signature:
export function createLightingEntity(store?: StateStore): SceneEntity {
  // store subscription in onAttach:
  if (store) {
    unsubs.push(store.subscribe('environment.lighting', (v) => {
      const cfg = v as EnvironmentState['lighting'];
      sun.visible = cfg.sun.enabled;
      sun.intensity = cfg.sun.intensity;
      sun.color.set(cfg.sun.color);
      // azimuth/elevation → position
      const a = cfg.sun.azimuth, e = cfg.sun.elevation;
      sun.position.set(90 * Math.cos(e) * Math.sin(a), 130 * Math.sin(e), -55 * Math.cos(e) * Math.cos(a));
      hemi.visible = cfg.hemisphere.enabled;
      hemi.intensity = cfg.hemisphere.intensity;
      fill.visible = cfg.fill.enabled;
      fill.intensity = cfg.fill.intensity;
      // point lights indexed — match existing order
      if (cfg.pointLights[0]) {
        stern.visible = cfg.pointLights[0].enabled;
        stern.intensity = cfg.pointLights[0].intensity;
        stern.color.set(cfg.pointLights[0].color);
      }
      if (cfg.pointLights[1]) {
        deckGlow.visible = cfg.pointLights[1].enabled;
        deckGlow.intensity = cfg.pointLights[1].intensity;
        deckGlow.color.set(cfg.pointLights[1].color);
      }
    }));
  }
```

Full implementation stores light references as closures and applies state on change.

- [ ] **Step 3: Make `createSkyEntity` accept store and subscribe to sky params**

```ts
export function createSkyEntity(store?: StateStore): SceneEntity {
  // In onAttach, after creating sky mesh:
  if (store) {
    unsubs.push(store.subscribe('environment.sky', (v) => {
      const cfg = v as EnvironmentState['sky'];
      const colors = skyGeo.attributes.color.array as Float32Array;
      const pos = skyGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const t = (y + 900) / 1800;
        const top = new THREE.Color(cfg.gradientTop);
        const bottom = new THREE.Color(cfg.gradientBottom);
        const c = bottom.clone().lerp(top, t);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      skyGeo.attributes.color.needsUpdate = true;
    }));
  }
}
```

- [ ] **Step 4: Make `createOceanEntity` accept store and subscribe to ocean color/opacity**

```ts
export function createOceanEntity(store?: StateStore): SceneEntity {
  // In onAttach, after creating material:
  if (store) {
    unsubs.push(store.subscribe('environment.ocean', (v) => {
      const cfg = v as EnvironmentState['ocean'];
      mat.color.set(cfg.color);
      mat.opacity = cfg.opacity;
    }));
  }
}
```

- [ ] **Step 5: Update `src/main.ts` to pass store to entity factories**

Change the entity creation lines:
```ts
entityManager.attach(createShipEntity(model, kernel.store), scene);
// ...
entityManager.attach(createOceanEntity(kernel.store), scene);
entityManager.attach(createSkyEntity(kernel.store), scene);
entityManager.attach(createLightingEntity(kernel.store), scene);
```

- [ ] **Step 6: Verify it compiles**

Run: `npx vite build 2>&1 | head -30`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add src/entity/ship-entity.ts src/entity/lighting-entity.ts src/entity/sky-entity.ts src/entity/ocean-entity.ts src/main.ts
git commit -m "feat: wire entities to state store subscriptions"
```

---

### Task 7: Inspector Plugin

**Files:**
- Create: `src/plugins/inspector/index.ts`
- Modify: `src/main.ts` — register inspector plugin

- [ ] **Step 1: Install lil-gui**

```bash
npm install lil-gui
```

Run: `npm install`
Expected: lil-gui added to package.json

- [ ] **Step 2: Create inspector plugin**

```ts
// src/plugins/inspector/index.ts
import GUI from 'lil-gui';
import type { ScenePlugin, Kernel } from '../types';

export const inspectorPlugin: ScenePlugin = (() => {
  let kernel: Kernel;
  let gui: GUI;
  let folders: GUI[] = [];

  return {
    id: 'inspector',
    label: 'Inspector',
    modes: new Set(['edit']),
    priority: 10,

    init(k: Kernel) {
      kernel = k;
      gui = new GUI({ title: 'CCIV Inspector' });
      buildEnvironment();
      buildInstances();
    },

    destroy() {
      gui.destroy();
      folders = [];
    },
  };

  function buildEnvironment() {
    const env = kernel.store.get('environment') as any;
    const sky = gui.addFolder('Sky');
    sky.add(env.sky, 'gradientTop').name('Top Color').onChange((v: string) => kernel.store.set('environment.sky.gradientTop', v));
    sky.add(env.sky, 'gradientBottom').name('Bottom Color').onChange((v: string) => kernel.store.set('environment.sky.gradientBottom', v));
    folders.push(sky);

    const fog = gui.addFolder('Fog');
    fog.add(env.fog, 'color').name('Color').onChange((v: string) => kernel.store.set('environment.fog.color', v));
    fog.add(env.fog, 'density', 0, 0.01).name('Density').onChange((v: number) => kernel.store.set('environment.fog.density', v));
    folders.push(fog);

    const sun = gui.addFolder('Sun');
    const l = env.lighting;
    sun.add(l.sun, 'enabled').name('Enabled').onChange((v: boolean) => kernel.store.set('environment.lighting.sun.enabled', v));
    sun.add(l.sun, 'intensity', 0, 10).name('Intensity').onChange((v: number) => kernel.store.set('environment.lighting.sun.intensity', v));
    sun.add(l.sun, 'color').name('Color').onChange((v: string) => kernel.store.set('environment.lighting.sun.color', v));
    sun.add(l.sun, 'azimuth', -Math.PI, Math.PI).name('Azimuth').onChange((v: number) => kernel.store.set('environment.lighting.sun.azimuth', v));
    sun.add(l.sun, 'elevation', 0, Math.PI / 2).name('Elevation').onChange((v: number) => kernel.store.set('environment.lighting.sun.elevation', v));
    folders.push(sun);

    const ocean = gui.addFolder('Ocean');
    ocean.add(env.ocean, 'color').name('Color').onChange((v: string) => kernel.store.set('environment.ocean.color', v));
    ocean.add(env.ocean, 'opacity', 0, 1).name('Opacity').onChange((v: number) => kernel.store.set('environment.ocean.opacity', v));
    folders.push(ocean);
  }

  function buildInstances() {
    const inst = kernel.store.get('instances') as any;
    const ship = gui.addFolder('Ship');
    ship.add(inst.ship, 'visible').name('Visible').onChange((v: boolean) => kernel.store.set('instances.ship.visible', v));

    const mat = ship.addFolder('Materials');
    for (const [group, overrides] of Object.entries(inst.ship.material)) {
      const g = mat.addFolder(group);
      g.add(overrides, 'color').name('Color').onChange((v: string) => kernel.store.set(`instances.ship.material.${group}.color`, v));
      g.add(overrides, 'roughness', 0, 1).name('Roughness').onChange((v: number) => kernel.store.set(`instances.ship.material.${group}.roughness`, v));
      g.add(overrides, 'metalness', 0, 1).name('Metalness').onChange((v: number) => kernel.store.set(`instances.ship.material.${group}.metalness`, v));
      g.add(overrides, 'visible').name('Visible').onChange((v: boolean) => kernel.store.set(`instances.ship.material.${group}.visible`, v));
      folders.push(g);
    }
    folders.push(mat, ship);
  }
})();
```

- [ ] **Step 3: Register inspector in `src/main.ts`**

After `const kernel = new Kernel()`, add:
```ts
kernel.registerPlugin(inspectorPlugin);
```

Import: `import { inspectorPlugin } from './plugins/inspector';`

- [ ] **Step 4: Verify build + open dev server**

Run: `npx vite build 2>&1 | head -20`
Expected: Build succeeds

Run: `npm run dev` and open browser — verify the lil-gui panel appears when you press Tab (mode switch). The panel may not have edit mode yet, but the GUI itself should appear.

- [ ] **Step 5: Commit**

```bash
git add src/plugins/inspector/index.ts src/main.ts
git commit -m "feat: add inspector plugin with lil-gui"
```

---

### Task 8: Gizmos Plugin

**Files:**
- Create: `src/plugins/gizmos/index.ts`
- Modify: `src/main.ts` — register gizmos plugin

- [ ] **Step 1: Create gizmos plugin**

```ts
// src/plugins/gizmos/index.ts
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import type { ScenePlugin, Kernel } from '../types';

export const gizmosPlugin: ScenePlugin = (() => {
  let kernel: Kernel;
  let controls: TransformControls;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerDown(e: PointerEvent) {
    if (controls.enabled === false) return;
    const rect = kernel.renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, kernel.camera);

    const meshes: THREE.Object3D[] = [];
    kernel.scene.traverse(child => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });

    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      controls.attach(hits[0].object);
      controls.visible = true;
    } else {
      controls.detach();
      controls.visible = false;
    }
  }

  return {
    id: 'gizmos',
    label: 'Gizmos',
    modes: new Set(['edit']),
    priority: 11,

    init(k: Kernel) {
      kernel = k;
      controls = new TransformControls(kernel.camera, kernel.renderer.domElement);
      controls.setMode('translate');
      controls.setSize(0.8);
      controls.visible = false;
      kernel.scene.add(controls);

      kernel.renderer.domElement.addEventListener('pointerdown', onPointerDown);
      controls.addEventListener('mouseDown', () => controls.enabled = false);
      controls.addEventListener('mouseUp', () => controls.enabled = true);
    },

    destroy() {
      controls.dispose();
      kernel.renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    },
  };
})();
```

- [ ] **Step 2: Register gizmos in `src/main.ts`**

```ts
kernel.registerPlugin(gizmosPlugin);
```

- [ ] **Step 3: Verify build**

Run: `npx vite build 2>&1 | head -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/plugins/gizmos/index.ts src/main.ts
git commit -m "feat: add gizmos plugin with TransformControls"
```

---

### Task 9: Snapshot Plugin

**Files:**
- Create: `src/plugins/snapshot/index.ts`
- Modify: `src/main.ts` — register snapshot plugin

- [ ] **Step 1: Create snapshot plugin**

```ts
// src/plugins/snapshot/index.ts
import type { ScenePlugin, Kernel } from '../types';

export const snapshotPlugin: ScenePlugin = (() => {
  let kernel: Kernel;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      save();
    }
    if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      load();
    }
  }

  function save() {
    const snap = kernel.store.snapshot();
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cciv-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function load() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const state = JSON.parse(text);
        kernel.store.restore(state);
      } catch {
        console.warn('Invalid snapshot file');
      }
    };
    input.click();
  }

  return {
    id: 'snapshot',
    label: 'Snapshot',
    modes: new Set(['edit']),
    priority: 20,

    init(k: Kernel) {
      kernel = k;
      window.addEventListener('keydown', onKeyDown);
    },

    destroy() {
      window.removeEventListener('keydown', onKeyDown);
    },
  };
})();
```

- [ ] **Step 2: Register snapshot in `src/main.ts`**

```ts
kernel.registerPlugin(snapshotPlugin);
```

- [ ] **Step 3: Verify build**

Run: `npx vite build 2>&1 | head -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/plugins/snapshot/index.ts src/main.ts
git commit -m "feat: add snapshot plugin with JSON save/load"
```

---

### Task 10: Location Switcher Plugin

**Files:**
- Create: `src/plugins/location-switcher/index.ts`
- Create: `src/plugins/location-switcher/index.test.ts`
- Modify: `src/main.ts` — register location-switcher

- [ ] **Step 1: Create location switcher plugin**

```ts
// src/plugins/location-switcher/index.ts
import type { ScenePlugin, Kernel } from '../types';
import { LOCATION_PRESETS, CCIV_WORLD } from '../../state/worlds';

export const locationSwitcherPlugin: ScenePlugin = (() => {
  let kernel: Kernel;
  let select: HTMLSelectElement;
  let transitioning = false;

  function switchTo(locationId: string) {
    if (transitioning) return;
    const preset = LOCATION_PRESETS[locationId];
    if (!preset) return;

    transitioning = true;
    const prevEnv = kernel.store.get('environment') as Record<string, unknown>;

    const start = performance.now();
    const duration = 2000;
    function tick() {
      const t = Math.min((performance.now() - start) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      const currFog = kernel.store.get('environment.fog') as Record<string, unknown>;
      if (typeof currFog.density === 'number' && typeof prevEnv.fog === 'object') {
        const prevDensity = (prevEnv.fog as Record<string, unknown>).density as number;
        const nextDensity = preset.environment.fog.density;
        kernel.store.set('environment.fog.density', prevDensity + (nextDensity - prevDensity) * ease);
      }

      if (t >= 1) {
        kernel.store.set('environment', preset.environment as Record<string, unknown>);
        kernel.store.set('instances', preset.instances as Record<string, unknown>);
        kernel.store.set('activeLocation', locationId);
        transitioning = false;
      } else {
        requestAnimationFrame(tick);
      }
    }
    tick();
  }

  return {
    id: 'location-switcher',
    label: 'Location Switcher',
    modes: new Set(['edit']),
    priority: 5,

    init(k: Kernel) {
      kernel = k;
      select = document.createElement('select');
      select.style.cssText = 'position:fixed;top:8px;left:8px;z-index:1000;padding:4px 8px;font-size:13px;';

      for (const locId of CCIV_WORLD.locations) {
        const opt = document.createElement('option');
        opt.value = locId;
        opt.textContent = locId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        select.appendChild(opt);
      }

      select.value = kernel.store.get('activeLocation') as string;
      select.addEventListener('change', () => switchTo(select.value));
      document.body.appendChild(select);
    },

    destroy() {
      select.remove();
    },
  };
})();
```

- [ ] **Step 2: Write test for location switcher logic**

```ts
// src/plugins/location-switcher/index.test.ts
import { describe, it, expect } from 'vitest';
import { LOCATION_PRESETS, CCIV_WORLD } from '../../state/worlds';

describe('location presets', () => {
  it('all CCIV locations have presets', () => {
    for (const locId of CCIV_WORLD.locations) {
      expect(LOCATION_PRESETS[locId]).toBeDefined();
    }
  });

  it('north-sea preset has ship instance', () => {
    const ns = LOCATION_PRESETS['north-sea'];
    expect(ns.instances.ship).toBeDefined();
    expect(ns.instances.ship.transform.scale).toBe(2.7);
  });
});
```

- [ ] **Step 3: Register location-switcher in `src/main.ts`**

```ts
kernel.registerPlugin(locationSwitcherPlugin);
```

- [ ] **Step 4: Verify build + tests**

Run: `npx vitest run src/plugins/location-switcher/ && npx vite build 2>&1 | head -20`
Expected: All passing

- [ ] **Step 5: Commit**

```bash
git add src/plugins/location-switcher/ src/main.ts
git commit -m "feat: add location switcher plugin with crossfade"
```

---

## Post-MVP Verification

Run full test suite and build:

```bash
npm run test
npm run build
```

**Expected:** All tests pass, production build succeeds.

## Next Steps After MVP

With the MVP workbench in place, the foundation is ready for:
- **More locations** — add `caribbean`, `arctic` presets with different env data
- **Play-mode plugins** — extract wave-sim, ship-motion, spray into plugin wrappers
- **Scene graph tree** — tree view of all scene objects with selection
- **Live reload** — watch file changes and hot-reload models
- **Material presets** — save/load material tweaks independently
