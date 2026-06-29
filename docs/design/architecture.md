# Architecture (current state)

Design invariants: `docs/design/invariants.md` — read before any change (locked).

## Layer compliance

| Layer | Directory | Status |
|---|---|---|
| Scene (gate) | `src/scene/` | Leaks — interface exposes `THREE.Object3D` via `.object3D` escape hatch |
| Rendering | `src/rendering/` | Leaks — imports Three.js directly |
| Environment | `src/environment/` | Leaks — imports Three.js directly |
| Physics | `src/physics/` | Clean — no Three.js imports |
| Controls | `src/controls/` | Leaks — imports Three.js directly |
| Entities | `src/entity/` | Leaks — imports Three.js directly |
| Plugins | `src/plugins/` | Leaks — imports Three.js directly |
| Kernel | `src/kernel.ts` | Leaks — imports Three.js types |

**Goal**: eliminate all direct dependency imports outside gate layers, and eliminate vendor type references in gate interfaces themselves. Every layer above accesses external packages through pure-our-vocabulary gate interfaces (`ISceneObject`, `IMaterial` — without `.object3D` or `.raw` escape hatches).

## File map

| Directory | Role | Dependencies |
|---|---|---|
| `src/scene/` | Three.js gate (adapter layer) | three.js |
| `src/physics/` | cannon-es gate | cannon-es |
| `src/rendering/` | Renderer, materials, loop | three.js (through scene) |
| `src/environment/` | Waves, textures, TSL shaders | three.js (through scene) |
| `src/controls/` | Ship controls, camera, active-vessel | three.js (through scene) |
| `src/entity/` | SceneEntity implementations | gates only |
| `src/plugins/` | Cross-cutting features | gates only |
| `src/kernel.ts` | Lifecycle, orchestration | gates only |

## Key modules

| Module | File | Responsibility |
|---|---|---|
| **Event bus** | `src/event-bus.ts` | Typed pub/sub (wraps mitt) |
| **State store** | `src/state/store.ts` | Dotted-path state (wraps zustand) |
| **Physics world** | `src/physics/world.ts` | CANNON.World singleton + fixed-step |
| **Buoyancy solver** | `src/physics/buoyancy.ts` | Per-vertex submerged force |
| **Ship controls** | `src/controls/ship-controls.ts` | Keyboard → thrust/steer |
| **Follow camera** | `src/controls/follow-camera.ts` | Vessel-tracked camera |
| **Active vessel** | `src/controls/active-vessel.ts` | Currently controlled vessel |
| **TSL ocean** | `src/environment/tsl-ocean.ts` | Gerstner waves via MeshPhysicalNodeMaterial |
| **TSL sky** | `src/environment/tsl-sky.ts` | Gradient sky via MeshBasicNodeMaterial (unused) |
| **Wave surface** | `src/environment/wave-surface.ts` | CPU wave height sampler for physics |
| **Entity manager** | `src/entity/manager.ts` | Entity lifecycle + per-entity disposers |
| **Model loader** | `src/model/loader.ts` | GLB load + catalog resolution + caching |
| **Rendering module** | `src/rendering/module.ts` | WebGPURenderer, scene, camera, RAF loop |

## Architecture Decision Records

All 14 ADRs in `docs/adr/`:

| # | Title |
|---|---|
| 001 | Model Abstraction Layer |
| 002 | Scene Entity Lifecycle |
| 003 | Asset Pipeline Architecture |
| 004 | WorldConfig Unification |
| 005 | EntityManager and Kernel Lifecycle Refinement |
| 006 | StateStore with Dotted-Path Subscriptions |
| 007 | Plugin System with Mode-Based Activation |
| 008 | InstanceState as Flat Record for Placed Props |
| 009 | Procedural Model Pipeline via Three.js Generators |
| 010 | Simulation as Plugin via EntityManager |
| 011 | Shared Selection via Kernel.selectedObject |
| 012 | Vite Build Configuration — Chunk Splitting and GLB Hot-Reload |
| 013 | Procedural Textures as Code |
| 014 | Model as Code — Parametric Definition |
