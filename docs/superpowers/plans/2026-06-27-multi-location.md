# Multi-Location Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generalize `InstanceState` to `Record<string, InstanceDef>` (ship no longer special), add caribbean/arctic/sunset location presets, create reactive instance manager entity.

**Architecture:** Flat instance record where every instance has optional `materials`. Instance manager subscribes to `instances` in the store and diffs on change — adds/removes/updates 3D objects. Ship remains a separate SceneEntity for wave-following but reads materials from `instances.ship.materials`.

**Tech Stack:** Three.js, TypeScript, StateStore

## Global Constraints

- Follow existing patterns: SceneEntity, factory functions, Disposer
- No new runtime dependencies
- Coordinate convention: Y-up, Z-bow(+), X-starboard(-)
- All locations reuse existing `buoy` and `island` models (no new GLB assets)
- Instance manager diffs by instance ID — not by index

---

### Task 1: Generalize InstanceState types

**Files:**
- Modify: `src/state/types.ts:35-45`

**Interfaces:**
- Consumes: existing `MaterialOverride` (unchanged)
- Produces: `InstanceDef`, `InstanceState = Record<string, InstanceDef>`

- [ ] **Step 1: Read current types**

Read `src/state/types.ts` to see the current `ShipInstanceState`, `InstanceState` definitions.

- [ ] **Step 2: Replace ShipInstanceState and InstanceState**

Replace lines 35-45 with:

```ts
export interface InstanceDef {
  ref: string
  transform: { position: [number, number, number]; rotation: [number, number, number]; scale: number }
  visible: boolean
  materials?: Record<string, MaterialOverride>
}

export type InstanceState = Record<string, InstanceDef>
```

- [ ] **Step 3: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: Type errors in files that still use old types (worlds.ts, inspector, ship-entity, tests — we fix those next).

- [ ] **Step 4: Commit**

```bash
git add src/state/types.ts
git commit -m "refactor: generalize InstanceState to Record<string, InstanceDef>"
```

---

### Task 2: Update north-sea preset + add 3 new location presets

**Files:**
- Modify: `src/state/worlds.ts`
- Modify: `src/state/defaults.ts` (automatic — already references LOCATION_PRESETS)

**Interfaces:**
- Consumes: `InstanceState = Record<string, InstanceDef>`, `LocationPreset`
- Produces: Updated `LOCATION_PRESETS` with 4 locations, `CCIV_WORLD.locations` with 4 entries

- [ ] **Step 1: Read current worlds.ts**

Read `src/state/worlds.ts` to see current shape.

- [ ] **Step 2: Convert north-sea to flat record format**

Replace the `instances` block with flat `Record<string, InstanceDef>`:

```ts
instances: {
  ship: {
    ref: 'ship',
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
    visible: true,
    materials: {
      hull: { color: '#3b2818', roughness: 0.92, metalness: 0, visible: true },
      deck: { color: '#887050', roughness: 0.88, metalness: 0, visible: true },
      sails: { color: '#f5edd9', roughness: 1, metalness: 0, visible: true },
      aft: { color: '#3b2818', roughness: 0.85, metalness: 0, visible: true },
      rigging: { color: '#3a2818', roughness: 0.9, metalness: 0, visible: true },
      details: { color: '#2e1c0c', roughness: 0.9, metalness: 0, visible: true },
      interior: { color: '#1a1008', roughness: 0.95, metalness: 0, visible: true },
    },
  },
  'buoy-1': {
    ref: 'buoy',
    transform: { position: [60, 0, 35], rotation: [0, 0, 0], scale: 1 },
    visible: true,
  },
  'buoy-2': {
    ref: 'buoy',
    transform: { position: [-55, 0, -25], rotation: [0, 0, 0], scale: 1 },
    visible: true,
  },
  island: {
    ref: 'island',
    transform: { position: [-200, 0, -150], rotation: [0, 0, 0], scale: 1 },
    visible: true,
  },
},
```

- [ ] **Step 3: Add caribbean preset**

```ts
'caribbean': {
  environment: {
    sky: { gradientTop: '#ff8844', gradientBottom: '#44bbdd', horizonOffset: 0 },
    waves: [
      { speed: 0.8, amplitude: 0.8, frequency: 0.120, steepness: 0.35 },
      { speed: 0.8, amplitude: 0.5, frequency: 0.200, steepness: 0.35 },
      { speed: 0.8, amplitude: 0.4, frequency: 0.300, steepness: 0.35 },
      { speed: 0.8, amplitude: 0.3, frequency: 0.450, steepness: 0.35 },
      { speed: 0.8, amplitude: 0.2, frequency: 0.600, steepness: 0.35 },
      { speed: 0.8, amplitude: 0.15, frequency: 0.800, steepness: 0.35 },
      { speed: 0.8, amplitude: 0.3, frequency: 0.350, steepness: 0.35 },
      { speed: 0.8, amplitude: 0.25, frequency: 0.500, steepness: 0.35 },
    ],
    ocean: { color: '#1080b0', opacity: 0.75, gridSize: 80, extent: 1800 },
    lighting: {
      sun: { enabled: true, intensity: 3.2, color: '#ffe8c0', azimuth: 0.6, elevation: 1.4 },
      hemisphere: { enabled: true, skyColor: '#80d0e0', groundColor: '#c08040', intensity: 1.2 },
      fill: { enabled: true, intensity: 0.4, color: '#80b0e0' },
      pointLights: [
        { enabled: true, intensity: 0.5, color: '#ffdd88', position: [0, 18, -35], range: 80 },
        { enabled: true, intensity: 0.2, color: '#ddaa66', position: [0, 10, 0], range: 50 },
      ],
    },
    fog: { type: 'exp2', color: '#88bbcc', density: 0.0008 },
  },
  instances: {
    ship: {
      ref: 'ship',
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
      visible: true,
      materials: {
        hull: { color: '#3b2818', roughness: 0.92, metalness: 0, visible: true },
        deck: { color: '#887050', roughness: 0.88, metalness: 0, visible: true },
        sails: { color: '#f5edd9', roughness: 1, metalness: 0, visible: true },
        aft: { color: '#3b2818', roughness: 0.85, metalness: 0, visible: true },
        rigging: { color: '#3a2818', roughness: 0.9, metalness: 0, visible: true },
        details: { color: '#2e1c0c', roughness: 0.9, metalness: 0, visible: true },
        interior: { color: '#1a1008', roughness: 0.95, metalness: 0, visible: true },
      },
    },
    'buoy-1': {
      ref: 'buoy',
      transform: { position: [80, 0, 45], rotation: [0, 0, 0], scale: 1 },
      visible: true,
    },
    'buoy-2': {
      ref: 'buoy',
      transform: { position: [-70, 0, -30], rotation: [0, 0, 0], scale: 1 },
      visible: true,
    },
    island: {
      ref: 'island',
      transform: { position: [-150, 0, -180], rotation: [0, 0, 0], scale: 1.2 },
      visible: true,
    },
  },
},
```

- [ ] **Step 4: Add arctic preset**

```ts
'arctic': {
  environment: {
    sky: { gradientTop: '#8899aa', gradientBottom: '#ccddee', horizonOffset: 0.02 },
    waves: [
      { speed: 0.5, amplitude: 0.6, frequency: 0.100, steepness: 0.30 },
      { speed: 0.5, amplitude: 0.4, frequency: 0.180, steepness: 0.30 },
      { speed: 0.5, amplitude: 0.3, frequency: 0.280, steepness: 0.30 },
      { speed: 0.5, amplitude: 0.2, frequency: 0.400, steepness: 0.30 },
      { speed: 0.5, amplitude: 0.15, frequency: 0.550, steepness: 0.30 },
      { speed: 0.5, amplitude: 0.1, frequency: 0.750, steepness: 0.30 },
      { speed: 0.5, amplitude: 0.25, frequency: 0.320, steepness: 0.30 },
      { speed: 0.5, amplitude: 0.2, frequency: 0.480, steepness: 0.30 },
    ],
    ocean: { color: '#305060', opacity: 0.88, gridSize: 80, extent: 1800 },
    lighting: {
      sun: { enabled: true, intensity: 1.2, color: '#c0d8e8', azimuth: 1.5, elevation: 0.4 },
      hemisphere: { enabled: true, skyColor: '#a0b0c0', groundColor: '#406070', intensity: 0.7 },
      fill: { enabled: true, intensity: 0.3, color: '#7088a0' },
      pointLights: [
        { enabled: true, intensity: 0.8, color: '#ddeeff', position: [0, 18, -35], range: 80 },
        { enabled: true, intensity: 0.3, color: '#bbddee', position: [0, 10, 0], range: 50 },
      ],
    },
    fog: { type: 'exp2', color: '#8899aa', density: 0.003 },
  },
  instances: {
    ship: {
      ref: 'ship',
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
      visible: true,
      materials: {
        hull: { color: '#3b2818', roughness: 0.92, metalness: 0, visible: true },
        deck: { color: '#887050', roughness: 0.88, metalness: 0, visible: true },
        sails: { color: '#f5edd9', roughness: 1, metalness: 0, visible: true },
        aft: { color: '#3b2818', roughness: 0.85, metalness: 0, visible: true },
        rigging: { color: '#3a2818', roughness: 0.9, metalness: 0, visible: true },
        details: { color: '#2e1c0c', roughness: 0.9, metalness: 0, visible: true },
        interior: { color: '#1a1008', roughness: 0.95, metalness: 0, visible: true },
      },
    },
    'buoy-1': {
      ref: 'buoy',
      transform: { position: [40, 0, 60], rotation: [0, 0, 0], scale: 1 },
      visible: true,
    },
    'buoy-2': {
      ref: 'buoy',
      transform: { position: [-30, 0, -50], rotation: [0, 0, 0], scale: 1 },
      visible: true,
    },
    island: {
      ref: 'island',
      transform: { position: [-180, 0, -100], rotation: [0, 0, 0], scale: 1 },
      visible: true,
    },
  },
},
```

- [ ] **Step 5: Add sunset preset**

```ts
'sunset': {
  environment: {
    sky: { gradientTop: '#cc4466', gradientBottom: '#ff9966', horizonOffset: -0.01 },
    waves: [
      { speed: 0.6, amplitude: 0.5, frequency: 0.110, steepness: 0.30 },
      { speed: 0.6, amplitude: 0.3, frequency: 0.190, steepness: 0.30 },
      { speed: 0.6, amplitude: 0.25, frequency: 0.290, steepness: 0.30 },
      { speed: 0.6, amplitude: 0.2, frequency: 0.420, steepness: 0.30 },
      { speed: 0.6, amplitude: 0.15, frequency: 0.580, steepness: 0.30 },
      { speed: 0.6, amplitude: 0.1, frequency: 0.780, steepness: 0.30 },
      { speed: 0.6, amplitude: 0.2, frequency: 0.340, steepness: 0.30 },
      { speed: 0.6, amplitude: 0.15, frequency: 0.500, steepness: 0.30 },
    ],
    ocean: { color: '#c06040', opacity: 0.78, gridSize: 80, extent: 1800 },
    lighting: {
      sun: { enabled: true, intensity: 1.8, color: '#ff8844', azimuth: 2.5, elevation: 0.3 },
      hemisphere: { enabled: true, skyColor: '#cc6699', groundColor: '#804030', intensity: 0.6 },
      fill: { enabled: true, intensity: 0.5, color: '#cc6644' },
      pointLights: [
        { enabled: true, intensity: 1.0, color: '#ffaa55', position: [0, 18, -35], range: 80 },
        { enabled: true, intensity: 0.4, color: '#dd8844', position: [0, 10, 0], range: 50 },
      ],
    },
    fog: { type: 'linear', color: '#cc7744', density: 0.001 },
  },
  instances: {
    ship: {
      ref: 'ship',
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
      visible: true,
      materials: {
        hull: { color: '#3b2818', roughness: 0.92, metalness: 0, visible: true },
        deck: { color: '#887050', roughness: 0.88, metalness: 0, visible: true },
        sails: { color: '#f5edd9', roughness: 1, metalness: 0, visible: true },
        aft: { color: '#3b2818', roughness: 0.85, metalness: 0, visible: true },
        rigging: { color: '#3a2818', roughness: 0.9, metalness: 0, visible: true },
        details: { color: '#2e1c0c', roughness: 0.9, metalness: 0, visible: true },
        interior: { color: '#1a1008', roughness: 0.95, metalness: 0, visible: true },
      },
    },
    'buoy-1': {
      ref: 'buoy',
      transform: { position: [50, 0, 25], rotation: [0, 0, 0], scale: 1 },
      visible: true,
    },
    'buoy-2': {
      ref: 'buoy',
      transform: { position: [-45, 0, -20], rotation: [0, 0, 0], scale: 1 },
      visible: true,
    },
    island: {
      ref: 'island',
      transform: { position: [-220, 0, -130], rotation: [0, 0, 0], scale: 1 },
      visible: true,
    },
  },
},
```

- [ ] **Step 6: Update CCIV_WORLD.locations**

```ts
export const CCIV_WORLD = {
  id: 'cciv',
  label: 'CCIV',
  locations: ['north-sea', 'caribbean', 'arctic', 'sunset'],
};
```

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: Type errors in files that still reference old `buoys`/`island` property paths — fix those next.

- [ ] **Step 8: Commit**

```bash
git add src/state/worlds.ts
git commit -m "feat: add caribbean, arctic, sunset location presets"
```

---

### Task 3: Update ship entity and inspector store paths

**Files:**
- Modify: `src/entity/ship-entity.ts:20`
- Modify: `src/plugins/inspector/index.ts:55-69`

**Interfaces:**
- Consumes: `InstanceState = Record<string, InstanceDef>` where ship entry uses `materials` (plural)
- Produces: Updated subscription paths using `materials` (plural)

- [ ] **Step 1: Update ship entity subscription path**

In `src/entity/ship-entity.ts:20`, change:

```ts
unsubs.push(store.subscribe('instances.ship.material', (v) => {
```

to:

```ts
unsubs.push(store.subscribe('instances.ship.materials', (v) => {
```

- [ ] **Step 2: Update inspector instance paths**

In `src/plugins/inspector/index.ts:61`, change:

```ts
for (const [group, overrides] of Object.entries(inst.ship.material)) {
  const g = mat.addFolder(group);
  g.add(overrides, 'color').name('Color').onChange((v: string) => kernel.store.set(`instances.ship.material.${group}.color`, v));
  g.add(overrides, 'roughness', 0, 1).name('Roughness').onChange((v: number) => kernel.store.set(`instances.ship.material.${group}.roughness`, v));
  g.add(overrides, 'metalness', 0, 1).name('Metalness').onChange((v: number) => kernel.store.set(`instances.ship.material.${group}.metalness`, v));
  g.add(overrides, 'visible').name('Visible').onChange((v: boolean) => kernel.store.set(`instances.ship.material.${group}.visible`, v));
```

to:

```ts
for (const [group, overrides] of Object.entries(inst.ship.materials)) {
  const g = mat.addFolder(group);
  g.add(overrides, 'color').name('Color').onChange((v: string) => kernel.store.set(`instances.ship.materials.${group}.color`, v));
  g.add(overrides, 'roughness', 0, 1).name('Roughness').onChange((v: number) => kernel.store.set(`instances.ship.materials.${group}.roughness`, v));
  g.add(overrides, 'metalness', 0, 1).name('Metalness').onChange((v: number) => kernel.store.set(`instances.ship.materials.${group}.metalness`, v));
  g.add(overrides, 'visible').name('Visible').onChange((v: boolean) => kernel.store.set(`instances.ship.materials.${group}.visible`, v));
```

Also update the `Ship` folder's visible binding (line 58) — it stays the same since `inst.ship.visible` still exists on InstanceDef.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/entity/ship-entity.ts src/plugins/inspector/index.ts
git commit -m "refactor: update subscription paths to instances.ship.materials (plural)"
```

---

### Task 4: Create instance manager entity

**Files:**
- Create: `src/entity/instance-manager.ts`
- Modify: `src/entity/index.ts`

**Interfaces:**
- Consumes: `ModelLoader`, `THREE.Scene`, `StateStore`, `ModelEntity`
- Produces: `createInstanceManager(modelLoader, scene, store): SceneEntity`

- [ ] **Step 1: Create instance-manager.ts**

Write `src/entity/instance-manager.ts`:

```ts
import * as THREE from 'three';
import type { SceneEntity } from './types';
import type { StateStore } from '../state/store';
import type { ModelLoader } from '../loaders/types';
import type { InstanceDef } from '../state/types';

export function createInstanceManager(
  modelLoader: ModelLoader,
  scene: THREE.Scene,
  store: StateStore,
): SceneEntity {
  const instances = new Map<string, { root: THREE.Group; ref: string }>();
  let unsub: (() => void) | null = null;

  function sync(prev: Record<string, InstanceDef> | undefined, next: Record<string, InstanceDef>) {
    const prevIds = prev ? new Set(Object.keys(prev)) : new Set<string>();
    const nextIds = new Set(Object.keys(next));

    // Remove instances no longer in the preset
    for (const id of prevIds) {
      if (!nextIds.has(id)) {
        const entry = instances.get(id);
        if (entry) {
          scene.remove(entry.root);
          instances.delete(id);
        }
      }
    }

    // Add or update instances
    for (const [id, def] of Object.entries(next)) {
      const existing = instances.get(id);
      if (existing) {
        // Update transform
        const tf = def.transform;
        existing.root.position.set(tf.position[0], tf.position[1], tf.position[2]);
        existing.root.rotation.set(tf.rotation[0], tf.rotation[1], tf.rotation[2]);
        existing.root.scale.setScalar(tf.scale);
        existing.root.visible = def.visible;
      } else {
        // Load new instance (models are preloaded, so this is sync)
        const model = modelLoader.getCached(def.ref);
        if (!model) continue;
        const root = model.root.clone(false);
        root.children = model.root.children.map(c => c.clone());
        const tf = def.transform;
        root.position.set(tf.position[0], tf.position[1], tf.position[2]);
        root.rotation.set(tf.rotation[0], tf.rotation[1], tf.rotation[2]);
        root.scale.setScalar(tf.scale);
        root.visible = def.visible;
        scene.add(root);
        instances.set(id, { root, ref: def.ref });
      }
    }
  }

  return {
    id: 'instance-manager',

    onAttach() {
      const initial = store.get('instances') as Record<string, InstanceDef>;
      sync(undefined, initial);
      unsub = store.subscribe('instances', (v) => {
        const prev = store.get('instances') as Record<string, InstanceDef>;
        sync(prev, v as Record<string, InstanceDef>);
      });
    },

    onDetach() {
      unsub?.();
      for (const [, entry] of instances) {
        scene.remove(entry.root);
      }
      instances.clear();
    },
  };
}
```

- [ ] **Step 2: Export from entity barrel**

In `src/entity/index.ts`, add:

```ts
export { createInstanceManager } from './instance-manager';
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: All tests pass (instance-manager has no tests yet).

- [ ] **Step 4: Commit**

```bash
git add src/entity/instance-manager.ts src/entity/index.ts
git commit -m "feat: add instance manager entity for reactive placed props"
```

---

### Task 5: Wire instance manager into main.ts with preload

**Files:**
- Modify: `src/main.ts`
- Modify: `src/loaders/index.ts` (ensure ModelLoader type is accessible)

**Interfaces:**
- Consumes: `createInstanceManager`, `LOCATION_PRESETS`, `modelLoader`, `scene`, `store`
- Produces: Bootstrapped app with instance manager + preloaded models

- [ ] **Step 1: Read current main.ts**

Read `src/main.ts` to understand current bootstrap flow.

- [ ] **Step 2: Add preload + instance manager wiring**

After the world loading block (after line 44 `entityManager.attach(createShipEntity(model, store), scene)`), add:

```ts
// Preload all model refs across all locations
const allRefs = new Set<string>();
for (const preset of Object.values(LOCATION_PRESETS)) {
  for (const def of Object.values(preset.instances)) {
    allRefs.add(def.ref);
  }
}
await modelLoader.preload(Array.from(allRefs));

// Wire instance manager for non-ship placed props
entityManager.attach(createInstanceManager(modelLoader, scene, store), scene);
```

Also add the import:

```ts
import { createInstanceManager } from './entity';
import { LOCATION_PRESETS } from './state/worlds';
```

- [ ] **Step 3: Remove old inline entity creation for buoys/island**

Remove the `for (const { model } of worldResult.entries)` loop entirely — the instance manager now handles all non-ship models. Keep only the ship entity attachment:

```ts
const shipEntry = worldResult.entries.find(e => e.model.id === 'ship');
if (shipEntry) {
  entityManager.attach(createShipEntity(shipEntry.model, store), scene);
}
```

The world loader still runs to load the ship model. For non-ship models, the preload + instance manager handles them.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: All tests pass. (main.ts is not unit-tested by vitest — requires browser.)

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/main.ts
git commit -m "feat: preload all location models, wire instance manager in main"
```

---

### Task 6: Update tests for new shape

**Files:**
- Modify: `src/state/store.test.ts`
- Modify: `src/plugins/location-switcher/index.test.ts`

- [ ] **Step 1: Update store test**

In `src/state/store.test.ts`, update the subscriber test on line 30-31. The path `instances.ship.transform` still works with the new `InstanceDef` shape — no path change needed. Verify it passes.

- [ ] **Step 2: Update location switcher test**

The test at line 13 accesses `ns.instances.ship`. With `InstanceState = Record<string, InstanceDef>`, `ns.instances.ship` is now `InstanceDef` instead of `ShipInstanceState`. The scale property path `ns.instances.ship.transform.scale` is the same. No code change needed — verify it passes.

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: All 57 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/state/store.test.ts src/plugins/location-switcher/index.test.ts
git commit -m "test: verify new InstanceState shape with existing tests"
```

---

### Self-Review

**1. Spec coverage:**
- Generalize InstanceState → Task 1 ✓
- Add 3 new location presets → Task 2 ✓
- Instance manager entity → Task 4 ✓
- Update ship/inspector paths → Task 3 ✓
- Preload all refs at startup → Task 5 ✓
- Wire instance manager → Task 5 ✓

**2. Placeholder scan:** No TBDs, TODOs, or incomplete sections.

**3. Type consistency:** 
- `instances.ship.material` → `instances.ship.materials` (plural) consistently applied in Tasks 3, 1, 2
- `InstanceState` as `Record<string, InstanceDef>` consistently used
- `InstanceDef` has `ref`, `transform`, `visible`, `materials?` — consistent everywhere
