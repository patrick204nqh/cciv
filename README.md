# CCIV — The Vessel

A 3D ship viewer and environment editor built with Three.js + Vite + TypeScript. Explore a fully realized vessel in a dynamic ocean scene with stormy atmosphere, ship's log telemetry, and a dual-mode editor/viewer interface.

```sh
npm install
npm run dev
```

## Controls

| Input | Action |
|---|---|
| Drag | Orbit camera |
| Scroll | Zoom |
| Right-drag | Pan |
| Tab | Toggle edit / play mode |

## Quick start

```sh
# Build all models (compile GLBs + publish manifest)
npm run build:models

# Start dev server
npm run dev
```

## Project structure

```
src/                   Runtime code
scripts/               Build pipeline + reference downloader
public/models/         Compiled GLB artifacts
public/textures/       Owned textures
docs/superpowers/      Specs and design documents
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm test` | Run all tests |
| `npm run build:models` | Compile all models → GLB + publish manifest |
| `npm run reference:pull` | Download external references → `.cache/references/` |

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for full diagrams, data flow, and module dependency graph.
