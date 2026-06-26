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
