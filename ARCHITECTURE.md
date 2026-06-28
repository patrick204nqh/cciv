# Architecture (current state)

Designed architecture: `DESIGN.md` — read before any change (invariant).

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

## File map (current)

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
