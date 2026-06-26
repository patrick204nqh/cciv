# CCIV Project

## Structure

- **`src/`** — Vite + TypeScript Three.js project. Entry point: `src/main.ts`.
  - `src/models/` — model library. Each model has its own subdirectory with config + geometry data.
    - `src/models/ship/` — CCIV ship model: 7 mesh groups with extracted geometry + `config.ts`.
  - `src/ship/` — convenience aliases (`createShip()`). New models import from `src/models/<id>/`.
  - `src/entity/` — SceneEntity implementations (ocean, sky, lighting, spray, wake, ship).
  - `src/model/` — core Model abstraction (types, registry, factory).
  - `src/event-bus.ts` — typed event bus singleton.
  - `src/environment/` — wave simulation utilities (`waves.ts`).
  - `src/textures/` — photoscanned PBR textures for the CCIV model (7 groups via Poly Haven pipeline).
  - `src/controls/` — OrbitControls from three/addons.
- **`index.html`** — minimal HTML shell with inline CSS; loads `src/main.ts`.
- **`docs/superpowers/specs-archive/` and `docs/superpowers/plans-archive/`** — archived design docs and implementation plans (stale after rebase).
- **`bin/dev`** — Ruby script that clones+updates skill source repos into `.cache/skills/`, then symlinks discovered skills into `.claude/skills/`, `.agents/skills/`, and `.opencode/skills/`. Run after adding a new skill source.
- **`.opencode/node_modules/`** — gitignored via `.opencode/.gitignore` (local plugin dependency for OpenCode).

## Commands

```sh
# Dev server with HMR
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build
npm run preview

# Sync skills from remote sources
ruby bin/dev

# Dry-run to preview what would be synced
ruby bin/dev --dry-run

# Fetch Poly Haven textures (downloads to public/textures/, generates src/textures/sources.ts)
node scripts/fetch-textures.mjs
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
- `createShip()` in `src/ship/index.ts` builds the model using the Model abstraction (`createModel(ccivConfig)`) with photoscanned PBR textures from Poly Haven.
- Texture pipeline: Poly Haven API → `scripts/fetch-textures.mjs` downloads to `public/textures/` and generates `src/textures/sources.ts`. Edit `scripts/textures.config.json` to add/change textures.
- New models: create `src/models/<id>/config.ts` with a `ModelConfig`, then `createModel(config)` returns a `ModelEntity`. See `src/model/types.ts` for the config shape.
- Entity lifecycle: implement `SceneEntity` (in `src/entity/types.ts`) and attach via `entityManager.attach()`. Entities communicate via the event bus (`src/event-bus.ts`).
