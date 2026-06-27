# Implementation Plan: Asset Pipeline

## Ordering

Each phase is independently verifiable. Phases 1–3 can be built and tested without touching existing code. Phase 4 is where the migration happens.

```
Phase 1: Primitives Library        ← standalone, no deps
Phase 2: Provider Seam + Registry  ← standalone, no deps
Phase 3: Runtime Loaders           ← standalone (test with any GLB)
Phase 4: Pipeline Scripts          ← depends on Phase 1 + 2
Phase 5: World Composition         ← depends on Phase 3
Phase 6: Migration                 ← depends on Phase 3 + 4
Phase 7: Cleanup                   ← everything else
```

---

## Phase 1 — Primitives Library (`src/primitives/`)

**Goal**: A library of `build*()` functions that return `THREE.BufferGeometry`.

### Tasks

1. **Create `src/primitives/types.ts`**
   ```typescript
   export type PrimitiveFn<P = Record<string, number>> = (params: P) => import('three').BufferGeometry;
   ```

2. **Create primitive functions**
   - `src/primitives/box.ts` — `buildBox(w, h, d, segW?, segH?, segD?)`
   - `src/primitives/cylinder.ts` — `buildCylinder(rTop, rBot, height, radialSeg?, heightSeg?)`
   - `src/primitives/sphere.ts` — `buildSphere(radius, widthSeg?, heightSeg?)`
   - `src/primitives/plane.ts` — `buildPlane(w, h, segW?, segH?)`
   - `src/primitives/lathe.ts` — `buildLathe(points: Vector2[], segments?)`

3. **Create `src/primitives/index.ts`** — re-export all primitives

### Verification
```typescript
const geo = buildBox(1, 2, 3);
console.assert(geo.attributes.position.count === 24); // 8 vertices × 3 faces
```

---

## Phase 2 — Provider Seam (`src/providers/`)

**Goal**: An `AssetProvider` interface with a Poly Haven adapter.

### Tasks

1. **Create `src/providers/types.ts`**
   ```typescript
   export interface AssetBundle {
     id: string;
     meshes: MeshData[];
     textures: Map<string, string>;  // semantic key → local path
     metadata: Record<string, unknown>;
   }

   export interface AssetProvider {
     readonly id: string;
     pull(assetId: string, destDir: string): Promise<AssetBundle>;
   }
   ```

2. **Create `src/providers/polyhaven.ts`** — downloads from Poly Haven API, extracts geometry + textures to `destDir`. Replaces `scripts/pull-reference.mjs` logic.

3. **Create `src/providers/registry.ts`**
   ```typescript
   export class ProviderRegistry {
     register(provider: AssetProvider): void;
     get(id: string): AssetProvider;
   }
   ```

4. **Create `src/providers/index.ts`** — re-export

### Verification
```typescript
const provider = new PolyHeavenProvider();
const bundle = await provider.pull('ship_pinnace', '.cache/raw/ship/');
console.assert(bundle.meshes.length > 0);
```

---

## Phase 3 — Runtime Loaders (`src/loaders/`)

**Goal**: Load GLB files at runtime, produce `ModelEntity`.

### Tasks

1. **Create `src/loaders/types.ts`**
   ```typescript
   export interface ModelCatalog {
     [id: string]: {
       glb: string;
       provider: string;
       materialOverrides?: Record<string, Partial<MaterialSpec>>;
       transform?: TransformSpec;
       metadata?: Record<string, unknown>;
     };
   }

   export interface ModelLoader {
     load(ref: string): Promise<ModelEntity>;
     preload(refs: string[]): Promise<void>;
     getCached(ref: string): ModelEntity | undefined;
   }
   ```

2. **Create `src/loaders/glb-loader.ts`**
   - Wraps `GLTFLoader` from three/addons
   - Accepts an optional Draco decoder
   - Returns `THREE.Group` with materials applied

3. **Create `src/loaders/catalog.ts`**
   - Reads `manifest.json` (embedded at build time via Vite JSON import or fetched at runtime)
   - Provides `getEntry(ref)` and `getAll()`

4. **Create `src/loaders/model-loader.ts`**
   - Implements `ModelLoader` interface
   - Uses `GlbLoader` internally
   - Caches loaded `ModelEntity` instances in a `Map<string, ModelEntity>`
   - Applies material overrides and transform from catalog entry

5. **Create `src/loaders/world-loader.ts`**
   - Accepts a `WorldConfig`, iterates `models` array
   - Calls `modelLoader.load(ref)` for each
   - Places them in scene with transform from config
   - Returns array of `SceneEntity` wrappers

6. **Create `src/loaders/index.ts`** — re-export

### Verification
```typescript
const loader = new ModelLoader(new GlbLoader());
const ship = await loader.load('ship');
console.assert(ship.root instanceof THREE.Group);
console.assert(ship.id === 'ship');
```

---

## Phase 4 — Pipeline Scripts (`scripts/pipeline/`)

**Goal**: Build-time scripts that process model configs into GLB artifacts.

### Tasks

1. **Create `scripts/pipeline/types.ts`** — shared types between pipeline stages

2. **Create `scripts/pipeline/pull.ts`**
   - Scans `src/models/` for `config.ts` files
   - For `extracted` configs: calls `provider.pull(asset, dest)`
   - For `procedural` configs: calls the generator, writes intermediate data
   - For `composite` configs: resolves primitives + sub-model refs, merges geometry
   - Output: `.cache/processed/<id>/` with intermediate geometry files

3. **Move & rewrite `src/scripts/compile-model.ts` → `scripts/pipeline/compile.ts`**
   - Same GLB compilation logic
   - Input: `.cache/processed/<id>/`
   - Output: `public/models/<id>.glb` (with Draco compression)
   - No longer imports from `src/` — reads from filesystem only

4. **Create `scripts/pipeline/publish.ts`**
   - Scans `public/models/` for `.glb` files
   - Reads metadata from `src/models/<id>/config.ts`
   - Writes `public/models/manifest.json`

5. **Create `scripts/pipeline/index.ts`** — orchestrator that runs all 4 stages

6. **Update `package.json` scripts**
   ```
   "pipeline:pull": "tsx scripts/pipeline/pull.ts",
   "pipeline:build": "tsx scripts/pipeline/build.ts",
   "pipeline:compile": "tsx scripts/pipeline/compile.ts",
   "pipeline:publish": "tsx scripts/pipeline/publish.ts",
   "build:models": "npm run pipeline:pull && npm run pipeline:build && npm run pipeline:compile && npm run pipeline:publish"
   ```

### Verification
```bash
npm run build:models
ls public/models/ship.glb      # exists
ls public/models/manifest.json  # exists
```

---

## Phase 5 — World Composition (`src/worlds/`)

**Goal**: Define and load worlds from TypeScript configs.

### Tasks

1. **Create `src/worlds/types.ts`**
   ```typescript
   export interface ModelInstance {
     ref: string;
     at: [number, number, number];
     rotation?: [number, number, number];
     scale?: number;
   }

   export interface WorldConfig {
     id: string;
     models: ModelInstance[];
     environment: {
       ocean?: boolean;
       sky?: boolean;
       lighting?: 'day' | 'night' | 'sunset';
     };
   }
   ```

2. **Create `src/worlds/north-sea.ts`** — example world with ship + buoys + island

3. **Create `src/worlds/index.ts`** — re-export worlds

4. **Update `src/main.ts`** to load a world instead of inline attach calls:
   ```typescript
   // Before
   entityManager.attach(createShipEntity(model), scene);
   entityManager.attach(createOceanEntity(), scene);
   // ...

   // After
   const world = await worldLoader.load(northSea, scene);
   world.entities.forEach(e => entityManager.attach(e, scene));
   ```

### Verification
```typescript
const world = await worldLoader.load(northSea, scene);
console.assert(world.entities.length === 6); // ship + 2 buoys + lighthouse + ocean + sky
```

---

## Phase 6 — Migration

**Goal**: Convert existing ship to new pipeline. Delete old code.

### Tasks

1. **Rewrite `src/models/ship/config.ts`**
   - Change from `extracted` with inline data to `extracted` with `provider: 'polyhaven'`

2. **Delete `src/models/ship/data/`** (29 files, 18 MB)

3. **Delete `src/models/ship/index.ts`** (the MeshData assembly file)

4. **Delete `src/scripts/`** (moved to `scripts/pipeline/`)

5. **Convert `src/textures/sources.ts` → `src/textures/manifest.json`**
   - Both pipeline and runtime read the JSON file

6. **Add `public/textures/` and `public/models/` to `.gitignore`**

7. **Update entity files to work with async model loading**
   - `entity/ship-entity.ts` — unchanged (still receives ModelEntity)
   - `entity/ocean-entity.ts` — unchanged
   - `entity/spray-entity.ts` — unchanged
   - `entity/wake-entity.ts` — unchanged

### Verification
```bash
npm run build:models
npm run build
npm run preview
# Ship renders identically, loaded from GLB
```

---

## Phase 7 — Generators (`src/generators/`)

**Goal**: Parameterized geometry generators for reusable shapes.

### Tasks

1. **Create `src/generators/types.ts`**
   ```typescript
   export type GeneratorFn<P> = (params: P) => THREE.BufferGeometry;
   ```

2. **Create generator files**
   - `src/generators/hull.ts` — `generateHull(length, beam, depth, bowShape)` for ship hulls
   - `src/generators/rigging.ts` — `generateRigging(mastCount, height, spread)` for ship rigging
   - `src/generators/buoy.ts` — buoy shapes
   - `src/generators/island.ts` — island terrain from noise

3. **Create model configs that use generators**
   - `src/models/buoy/config.ts` — procedural, uses `generateBuoy`
   - `src/models/island/config.ts` — procedural, uses `generateIsland`

4. **Create `src/generators/index.ts`** — re-export

### Verification
```typescript
const hull = generateHull({ length: 30, beam: 8, depth: 5 });
console.assert(hull.attributes.position.count > 0);
```

---

## Phase 8 — Polish

- Update CONTEXT.md with new domain terms (pipeline, provider, world, loader, primitive, generator)
- Delete `scripts/pull-reference.mjs` and `scripts/build-model.mjs` (replaced by pipeline)
- Delete `src/scripts/lib/paths.ts` (replaced by pipeline types)
- Verify `npm run dev` works with no committed textures (falls back to generated/preloaded)
- Write a quickstart in README: "Add a new model: `mkdir src/models/my-thing && code config.ts`"

---

## File Change Summary

| Action | Files |
|---|---|
| **Create** | `src/primitives/` (5 files), `src/providers/` (4 files), `src/loaders/` (6 files), `src/worlds/` (3 files), `src/generators/` (5 files), `scripts/pipeline/` (5 files) |
| **Modify** | `src/main.ts`, `package.json`, `.gitignore`, `src/textures/sources.ts` → `manifest.json` |
| **Delete** | `src/models/ship/data/` (29 files), `src/models/ship/index.ts`, `src/scripts/` (3 files), `scripts/pull-reference.mjs`, `scripts/build-model.mjs` |
| **Keep unchanged** | `src/entity/` (all 7 files), `src/model/` (3 files), `src/material/` (3 files), `src/environment/`, `src/time/`, `src/event-bus.ts`, `src/util/disposer.ts` |

---

This plan runs sequentially but each phase is self-contained. You can stop after Phase 3 and have a working GLB loader without touching the old pipeline. The migration (Phase 6) is the largest single change but it's mechanical — the entity interfaces don't change.
