# CCIV — The Vessel

A 3D ship viewer and environment editor built with Three.js + Vite + TypeScript.

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
npm run setup     # compile models + publish manifest
npm run dev       # start dev server
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm test` | Run all tests |
| `npm run setup` | Compile all models → GLB + publish manifest |
| `npm run reference` | Download external references → `.cache/references/` |

## Document registry

| File | Contents |
|---|---|
| `AGENTS.md` | AI agent instructions — structure, commands, conventions, design invariant checks |
