# ADR-004: Procedural Model Pipeline via Three.js Generators

## Status
Accepted

## Date
2026-06-27

## Context
The scene needs 3D models (ship, island, buoy, palm tree, ice floe) that are fast to iterate on and don't require external 3D modeling tools. Models must be available as GLB files that the browser can load at runtime.

## Decision
A three-stage pipeline for procedural model generation:

1. **Generator script** (`scripts/build/<id>.ts`): Uses Three.js `BufferGeometry` utilities to create geometry for each mesh group. Writes typed-array data files to `src/models/<id>/data/<group>_<attr>.js` (position, normal, uv, index per group).

2. **Compiler** (`scripts/pipeline/compile.ts`): Reads the typed-array files and compiles them into a Draco-compressed GLB file at `public/models/<id>.glb` using `@gltf-transform/core`.

3. **Publisher** (`scripts/pipeline/publish.ts`): Generates `public/models/manifest.json` listing all available models with their GLB paths and material overrides from config.

Each model has a `config.ts` in its directory for material overrides and transform defaults. Models with no `data/` directory are skipped during compilation (for hand-crafted GLBs).

### Multi-group models
Models with multiple mesh groups (e.g. palm-island with base, trunk, fronds, coconuts) write separate data files per group. The compiler creates one mesh per group, each with its own material from config.

## Alternatives Considered

### Pre-made GLB files from external sources
- Pros: Higher visual quality, less code
- Cons: Dependency on external assets and licenses; harder to modify; model pipeline requires external tools

### Runtime procedural geometry (no compilation step)
- Pros: No build step, instant iteration
- Cons: Slower load time; no Draco compression; can't use GLB-specific features; geometry generation runs every page load

### Single merged mesh per model
- Pros: Simpler pipeline, fewer draw calls
- Cons: Can't have per-group materials; model can't be reused with different material configs

## Consequences
- Models are self-contained in `src/models/<id>/` with source (generator/data files) and config
- Adding a new model: create generator → run once → compile → ready
- No external asset dependencies — everything is generated from code
- Models are cached in the browser (GLB files with versioned URLs)
- Iteration cycle: edit generator → run `npm run setup` → browser auto-reloads (via GLB hot-reload plugin)
- Pipeline runs in Node.js via `tsx`, no build tool configuration needed
