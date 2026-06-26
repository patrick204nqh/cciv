# CCIV Project

## Structure

- **`src/`** — Vite + TypeScript Three.js project. Entry point: `src/main.ts`.
  - `src/models/<id>/` — owned models. Each has `config.ts` + `index.ts` + `data/` (extracted geometry).
    - `src/models/ship/` — CCIV ship: 7 mesh groups with extracted geometry + `config.ts`.
  - `src/entity/` — SceneEntity implementations (ocean, sky, lighting, spray, wake, ship).
  - `src/model/` — core Model abstraction (types, registry, factory).
  - `src/event-bus.ts` — typed event bus singleton.
  - `src/environment/` — wave simulation utilities (`waves.ts`).
  - `src/textures/` — generated texture manifest (`sources.ts`) + procedural fallbacks (`index.ts`).
  - `src/controls/` — OrbitControls from three/addons.
- **`index.html`** — minimal HTML shell with inline CSS; loads `src/main.ts`.
- **`scripts/`** — build tools.
  - `pull-reference.mjs` — downloads + extracts external assets to `.cache/references/` (throwaway).
  - `references.json` — list of external sources to pull.
  - `build-model.mjs` — copies reference data into `src/models/<id>/`, renames with our conventions, generates config/textures.
  - `models.json` — mapping from reference → owned model with mesh renames + material overrides.
- **`public/textures/<model>/`** — owned textures (committed), copied from reference during build-model.

## Commands

```sh
# Dev server with HMR
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build
npm run preview

# Step 1: Pull external references → .cache/references/
npm run model:pull

# Step 2: Build owned models from references
npm run model:build

# Step 3: Compile owned models to portable GLB artifacts
npm run model:compile
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

## Conventions

- Skills are symlinked (not copied). Edit in the cache dir at `.cache/skills/<name>/` if you need to modify an upstream skill.
- Coordinate convention: Y-up, Z-bow(+), X-starboard(-).
- Ship model extracted into-code: `src/models/ship/` contains hardcoded Float32Array/Uint16Array geometry for all 7 mesh groups (hull, deck, sails, aft, rigging, details, interior).
- Texture pipeline: external reference → `.cache/references/` (gitignored, throwaway). Then `scripts/build-model.mjs` copies textures to `public/textures/<model>/` and generates `src/textures/sources.ts`.
- New models: add entry to `scripts/models.json`, run `build-model.mjs`. The model becomes owned code in `src/models/<id>/` with clean naming — no reference prefixes leak in.
- Entity lifecycle: implement `SceneEntity` (in `src/entity/types.ts`) and attach via `entityManager.attach()`. Entities communicate via the event bus (`src/event-bus.ts`).
