# HMS Beagle Project

## Structure

- **`src/`** — Vite + TypeScript Three.js project. Entry point: `src/main.ts`.
  - `src/ship/` — importable ship model library (one module per subsystem: hull, deck, masts, sails, rigging, cannons, deckDetails, boats). `createShip()` returns a `THREE.Group`.
  - `src/environment/` — ocean, sky, lighting.
  - `src/textures/` — photoscanned PBR textures via Poly Haven pipeline. Procedural canvas fallbacks kept as `*Procedural()` exports.
  - `src/materials/` — all materials as a shared `M` object.
  - `src/controls/` — OrbitControls from three/addons.
  - `src/geometry.ts` — shared helpers (`cyl`, `box`, `addMesh`, `line`).
- **`index.html`** — minimal HTML shell with inline CSS; loads `src/main.ts`.
- **`docs/references/Darling_HMS_Beagle_A6739.pdf`** — historical reference for the ship design.
- **`docs/superpowers/specs/` and `docs/superpowers/plans/`** — design docs and implementation plans.
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
- All textures are procedural (canvas-based) — no external image assets.
- Texture pipeline: Poly Haven API → `scripts/fetch-textures.mjs` downloads to `public/textures/` and generates `src/textures/sources.ts`. Edit `scripts/textures.config.json` to add/change textures.
- Ship modules import `M` from `../materials` directly (singleton).
