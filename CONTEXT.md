# Dream World — Domain Glossary

## Models

**Model** — a 3D object in the world. Has geometry, materials, textures, and a transform. Produced via one of three source types.

**ModelConfig** — configuration data that describes a model. Discriminated by source type. Lives at `src/models/<id>/config.ts` or in a central config registry.

**ModelEntity** — the runtime object wrapping a `THREE.Group`. Carries `metadata` (id, source, license, poly count) and lifecycle methods (`dispose()`).

**ModelRegistry** (singleton) — central registry of all active models. Created models auto-register; `dispose()` unregisters.

## Source Types

**Extracted model** — geometry imported from glTF/GLB once and extracted into code as typed array data files (`_pos.js`, `_nml.js`, etc.). Owned and customizable.

**External model** — GLB/glTF loaded at runtime from a URL or local file. Not extracted — geometry data lives outside the codebase.

**Procedural model** — geometry built entirely in code using helpers (`cyl`, `box`, custom `BufferGeometry`).

## Scene

**SceneEntity** — interface with lifecycle hooks: `onAttach(scene)`, `onBeforeUpdate(dt)`, `onUpdate(dt)`, `onDetach()`. Each entity owns its update logic. (ADR-002)

**EntityManager** (singleton) — owns the entity list, runs the RAF loop, controls lifecycle. Testable via `manager.update(dt)`. (ADR-002)

**Event bus** (singleton) — decouples entities. Events: `entity:attached`, `entity:detached`, `entity:position-changed`. (ADR-002)

## Materials

**MaterialRegistry** — manages material creation, reuse, and disposal. Provides global quality overrides. (ADR-004)
