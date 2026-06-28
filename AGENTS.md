# CCIV Project

Design invariants: `docs/design/invariants.md` — read before any change (locked).
Architecture reference: `docs/design/architecture.md` — layer audit, file map, ADR index.

## Structure

- **`src/`** — Vite + TypeScript Three.js project. Entry point: `src/main.ts`.
  - `src/models/<id>/` — owned models. Each has `config.ts` + `index.ts` + `data/` (extracted geometry).
    - `src/models/ship/` — CCIV ship: 7 mesh groups with extracted geometry + `config.ts`.
  - `src/scene/` — Three.js wrapper layer: `ISceneObject` interface, `SceneObject` adapter class.
  - `src/entity/` — SceneEntity implementations (ocean, sky, lighting, spray, wake, ship).
  - `src/model/` — core Model abstraction (types, registry, factory).
  - `src/event-bus.ts` — typed event bus singleton.
  - `src/environment/` — wave simulation utilities (`waves.ts`).
  - `src/textures/` — generated texture manifest (`sources.ts`) + procedural fallbacks (`index.ts`).
  - `src/controls/` — OrbitControls from three/addons.
- **`index.html`** — minimal HTML shell with inline CSS; loads `src/main.ts`.
- **`scripts/`** — build tools.
  - `reference/pull.ts` — downloads external assets to `.cache/references/`.
  - `references.json` — list of external sources to pull.
  - `pipeline/` — compile + publish stages for GLB artifacts.
  - `build/` — procedural model generators (palm-island, ice-floe).
  - `generate.ts` — CLI runner for procedural model generation.
- **`public/textures/<model>/`** — owned textures (committed), copied from reference during build-model.

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
- Ship model extracted into-code: `src/models/ship/` contains hardcoded Float32Array/Uint16Array geometry for all 7 mesh groups (hull, deck, sails, aft, rigging, details, interior).
- Texture pipeline: external reference → `.cache/references/` (gitignored, throwaway). Then `scripts/build-model.mjs` copies textures to `public/textures/<model>/` and generates `src/textures/sources.ts`.
- Entity lifecycle: implement `SceneEntity` (in `src/entity/types.ts`) and attach via `entityManager.attach()`. Entities communicate via the event bus (`src/event-bus.ts`).
- All Three.js scene graph interaction goes through `ISceneObject` (`src/scene/types.ts`). Never pass `THREE.Object3D` directly across module boundaries. `SceneObject` adapter wraps raw Three.js objects. Use `.object3D` escape hatch only when Three.js interop is unavoidable (TransformControls, raycaster).
- Skills provide specialized instructions and workflows for specific tasks.
  Use the skill tool to load a skill when a task matches its description.
