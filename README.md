# Dream World

A 3D world engine built with Three.js + Vite + TypeScript.

```sh
npm install
npm run dev
```

## Quick start

```sh
# Build all models (compile GLBs + publish manifest)
npm run build:models

# Start dev server
npm run dev
```

## Project structure

See [`docs/architecture.md`](docs/architecture.md) for full diagrams, data flow, and module dependency graph.

```
src/                   Runtime code (260 KB, 60 files)
scripts/               Build pipeline + reference downloader
public/models/         Compiled GLB artifacts (gitignored)
.cache/references/     External reference data (gitignored)
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run test` | Run all tests |
| `npm run build:models` | Compile all models → GLB + publish manifest |
| `npm run reference:pull` | Download external references → `.cache/references/` |
