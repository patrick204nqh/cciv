# Dream World — Domain Glossary

## Scripts Architecture

**compile-model** (`src/scripts/compile-model.ts`) — compiled model to GLB. Runs via `tsx`. Imports `TEXTURES` from `src/textures/sources.ts` directly (no regex parsing). Keeps build scripts (`scripts/pull-reference.mjs`, `scripts/build-model.mjs`) as standalone Node.js scripts — they have no shared types with the runtime.

**paths** (`src/scripts/lib/paths.ts`) — shared path construction for the compile script. Provides `ROOT`, `modelDataDir()`, `modelTexDir()`, `glbOutPath()`.

**tsx** — TypeScript runner for Node.js (devDependency). Used for `npm run model:compile` and any future TypeScript scripts in `src/scripts/`.

**Remaining build scripts** (`scripts/`) — `pull-reference.mjs` downloads Poly Haven assets; `build-model.mjs` copies + renames into `src/models/<id>/` and generates config. These are pure build tooling with no runtime type sharing.

## Utilities

**Disposer** (`src/util/disposer.ts`) — collects `THREE.BufferGeometry`, `Material`, `Object3D` instances, unsubscribe functions, and arbitrary cleanup callbacks. Calling `dispose()` runs them all in order. Used by every entity and the model factory to eliminate duplicated cleanup patterns. One implementation pays back across 6 entities + factory.

## Models

**Model** — a 3D object in the world. Has geometry, materials, textures, and a transform. Produced via one of three source types.

**ModelConfig** — configuration data that describes a model. Discriminated by source type. Lives at `src/models/<id>/config.ts`.

**ModelEntity** — the runtime object wrapping a `THREE.Group`. Carries `metadata` (id, source, license, poly count) and lifecycle methods (`dispose()`).

**ModelRegistry** (singleton, `src/model/registry.ts`) — central registry of all active models. Created models auto-register; `dispose()` unregisters.

## Source Types

**Extracted model** — geometry imported from glTF/GLB once and extracted into code as typed array data files (`data/{group}/pos.js`, etc.). Owned and customizable.

**External model** — GLB/glTF loaded at runtime from a URL or local file. Not extracted.

**Procedural model** — geometry built entirely in code using helpers.

## Materials

**MaterialRegistry** (singleton, `src/material/registry.ts`) — manages material creation, reuse, and disposal. Provides `getOrCreate(MaterialSpec)` that caches by spec, and global quality overrides (`setQualityLevel('low'|'medium'|'high')`). Replaces ad-hoc `buildMaterial()` in the factory. Normal maps disabled at 'low' quality.

**MaterialSpec** (`src/material/types.ts`) — canonical description of a material. Fields: `textureKey`, `color`, `roughness`, `metalness`, `transparent`, `alphaTest`, `side`. Consumed by `MaterialRegistry` to produce `THREE.MeshStandardMaterial`.

## Time

**WorldClock** (singleton, `src/time/world-clock.ts`) — monotonically increasing elapsed time accumulated from `dt`. Entities read `worldClock.elapsed` instead of managing local `t` counters. Fixes framerate-dependent wave speed. Provides `timeScale` and `paused`.

**EntityManager** (singleton, `src/entity/manager.ts`) — calls `worldClock.update(dt)` before entity updates. All entities share the same time source.

## Scene

**SceneEntity** — interface with lifecycle hooks: `onAttach(scene)`, `onBeforeUpdate?(dt)` (optional, only ship uses it), `onUpdate(dt)`, `onDetach()`. Each entity owns its update logic. (ADR-002)

**EntityManager** (singleton) — owns the entity list, runs the RAF loop, controls lifecycle. Testable via `manager.update(dt)`. (ADR-002)

**Event bus** (singleton, `src/event-bus.ts`) — decouples entities. Events: `entity:attached`, `entity:detached`, `entity:position-changed`.

## Waves

**`sampleOcean(x, z, t)`** (`src/environment/waves.ts`) — returns `{ height, dispX, dispZ }` (plain object). Gerstner wave simulation.

**`sampleNormal(x, z, t)`** — returns `{ x, y, z }` (plain object, consistent with `sampleOcean`). Wave surface normal.

## Asset Pipeline (ADR-003)

The asset pipeline transforms raw assets from multiple providers into compiled GLB artifacts. It has four stages: **pull**, **build**, **compile**, **publish**.

### Providers

**AssetProvider** (`src/providers/types.ts`) — interface for pulling assets from external sources. Implementations:
- **PolyHeavenProvider** — downloads from Poly Haven API
- **LocalProvider** — reads from local filesystem

**ProviderRegistry** — singleton that maps provider IDs to implementations.

### Pipeline Stages

- **pull** — reads model configs from `src/models/<id>/config.ts`, downloads raw assets via the configured provider to `.cache/raw/<id>/`
- **build** — applies model definition (extracted → copy, procedural → run generator, composite → assemble primitives) to `.cache/processed/<id>/`
- **compile** — compiles processed geometry to Draco-compressed GLB at `public/models/<id>.glb`
- **publish** — scans `public/models/` for GLBs, reads metadata from configs, writes `public/models/manifest.json`

### Model Creation Paths

Three ways to create a model, defined in `src/models/<id>/config.ts`:

1. **extracted** — geometry from an external provider (Poly Haven, etc.)
2. **procedural** — geometry generated by a TypeScript function in `src/generators/`
3. **composite** — geometry assembled from primitives (`src/primitives/`) + sub-model references

### Primitives

**Primitives** (`src/primitives/`) — library of `buildBox()`, `buildCylinder()`, `buildSphere()`, `buildPlane()`, `buildLathe()` that return `THREE.BufferGeometry`. Used by composite models and procedural generators.

### Generators

**Generators** (`src/generators/`) — parameterized functions that produce geometry: `generateHull(length, beam, depth)`, `generateRigging(mastCount, height)`, etc. Called at build time, compiled to GLB.

### Runtime Loaders

**Loaders** (`src/loaders/`) — runtime modules for loading compiled artifacts:

- **GlbLoader** — wraps Three.js GLTFLoader, returns `THREE.Group`
- **ModelLoader** — resolves model refs via catalog, loads GLBs, applies overrides, caches `ModelEntity` instances
- **Catalog** — reads `public/models/manifest.json`, provides `getEntry(ref)`
- **WorldLoader** — loads a `WorldConfig`, resolves all model refs, places them in the scene

### Worlds

**WorldConfig** (`src/worlds/types.ts`) — declarative scene composition. A world lists model instances with positions and an environment config. Loaded by `WorldLoader` at startup.

```
src/worlds/north-sea.ts → loads ship at origin, buoys at offsets, ocean/sky/lighting
```

Wiring: `main.ts` calls `worldLoader.load(config, scene)` → returns `SceneEntity[]` → `entityManager.attach()` each.
