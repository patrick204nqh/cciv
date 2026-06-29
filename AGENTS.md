# CCIV Project

Design invariants: `docs/design/invariants.md` — read before any change (locked).
Architecture reference: `docs/design/architecture.md` — layer audit, file map, ADR index.

## Structure

- **`src/`** — Vite + TypeScript Three.js project. Entry point: `src/main.ts`.
  - `src/model/` — core Model abstraction + definitions + loaders.
    - `src/model/types.ts` — ModelEntity, ModelConfig, ModelCatalog, ModelLoader, WorldLoadResult.
    - `src/model/definitions/<id>/config.ts` — owned model configs.
    - `src/model/definitions/<id>/data/` — geometry as Float32Array JS literals (git tracked, source of truth).
  - `src/graphics/` — Three.js gate layer: `ISceneObject`, `SceneObject`, `SceneAdapter`, `RenderingModule`.
  - `src/entity/` — SceneEntity implementations (ocean, sky, lighting, spray, wake, ship).
  - `src/environment/` — wave simulation utilities (`waves.ts`).
  - `src/physics/` — cannon-es gate layer.
  - `src/controls/` — input handling (OrbitControls, ship controls).
  - `src/state/` — Zustand-based state management.
  - `src/plugins/` — cross-cutting UI/debug features.
  - `src/ui/` — React overlay layer.
  - `src/util/` — Disposer, PositionTracker, WorldClock, event-bus.
  - `src/controller/` — orchestration seam for world-level operations (WorldController).
  - `src/kernel.ts` — bootstrap orchestrator.
- **`index.html`** — minimal HTML shell with inline CSS; loads `src/main.ts`.
- **`scripts/`** — build tools.
  - `reference/pull.ts` — downloads external assets to `.cache/references/`.
  - `references.json` — list of external sources to pull.
  - `pipeline/` — compile (reads `src/model/definitions/<id>/data/`) + publish (writes `public/models/manifest.json`).
  - `build/` — procedural model generators (palm-island, ice-floe).
  - `generate.ts` — CLI runner for procedural model generation (writes to `src/model/definitions/<id>/data/`).
- **`.cache/`** — gitignored, ephemeral: `references/` (raw downloads) only.

## Commands

```sh
# Dev server with HMR
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build
npm run preview

# Setup after clone (compile models + publish manifest)
npm run setup

# Pull external references → .cache/references/
npm run reference
```

## Skill sources (defined in bin/dev)

| Source | Repo |
|---|---|
| superpowers | obra/superpowers |
| impeccable | pbakaus/impeccable |
| agent-skills | addyosmani/agent-skills |
| skills-best-practices | mgechev/skills-best-practices |
| stop-slop | hardikpandya/stop-slop |
| mattpocock-skills | mattpocock/skills |
| threejs-skills | CloudAI-X/threejs-skills |

Add new sources by appending to `SOURCES` in `bin/dev:19-27`.

## Reference Sources

| Source | URL |
|---|---|
| **threejs-api** | https://threejs.org/docs/llms-full.txt (official Three.js API ref for LLMs) |

## Conventions

- Skills are symlinked (not copied). Edit in the cache dir at `.cache/skills/<name>/` if you need to modify an upstream skill.
- Coordinate convention: Y-up, Z-bow(+), X-starboard(-).
- Ship model config: `src/model/definitions/ship/config.ts` — material overrides baked into GLB at compile time.
- Entity lifecycle: implement `SceneEntity` (in `src/entity/types.ts`) and attach via `entityManager.attach()`. Entities communicate via the event bus (`src/util/event-bus.ts`).
- All Three.js scene graph interaction goes through `ISceneObject` (`src/graphics/types.ts`). Never pass `THREE.Object3D` directly across module boundaries. `SceneObject` adapter wraps raw Three.js objects. Use `.object3D` escape hatch only when Three.js interop is unavoidable (TransformControls, raycaster).
- Skills provide specialized instructions and workflows for specific tasks.
  Use the skill tool to load a skill when a task matches its description.

## Design invariant checks

Before every code change, read `docs/design/invariants.md` (the 8 golden rules). During and after the change, flag any violations:

| Rule | What to check |
|---|---|
| 1 | Does the new code straddle two layers (e.g., both orchestrates AND adapts)? |
| 2 | Is a library imported directly outside its gate layer? |
| 3 | Does a gate interface expose a vendor type (.raw, .object3D)? |
| 4 | Does application code bypass a gate and call the library directly? |
| 5 | Does this introduce a second way to do something that already exists? |
| 6 | Could a built-in replace custom logic (e.g., PlaneGeometry, Raycaster)? |
| 7 | Does the code match surrounding patterns in the same layer? |
| 8 | Is the module's interface complete, or does it need future patches? |

If a violation is unavoidable, stop and propose updating `docs/design/invariants.md` — never silently bypass a golden rule.
