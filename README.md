# CCIV

A 3D world built with Three.js + Vite + TypeScript.

```sh
npm install
npm run dev
```

## Architecture

```
src/
├── main.ts              # Entry point — scene, camera, renderer, thin loop
├── model/               # Core Model abstraction
│   ├── types.ts         # ModelConfig, ModelEntity, MeshGroupSpec
│   ├── registry.ts      # ModelRegistry singleton
│   └── factory.ts       # createModel(config) → ModelEntity
├── models/              # Model library — each model in its own directory
│   └── ship/            # CCIV ship: extracted geometry + config.ts + data/
├── entity/              # SceneEntity interface + EntityManager + implementations
│   ├── types.ts         # SceneEntity lifecycle interface
│   ├── manager.ts       # EntityManager singleton
│   ├── ship-entity.ts   # Ship wave response, emits position-changed
│   ├── ocean-entity.ts  # Ocean grid with wave displacement
│   ├── sky-entity.ts    # Sky dome + horizon ring
│   ├── lighting-entity.ts # Sun, hemisphere, fill lights
│   ├── spray-entity.ts  # Bow spray particles (listens to event bus)
│   └── wake-entity.ts   # Wake mesh (listens to event bus)
├── event-bus.ts         # Typed singleton with 3 events
├── environment/         # Wave simulation (pure functions)
│   └── waves.ts         # sampleOcean, sampleNormal
├── textures/            # Generated texture manifest + procedural fallbacks
│   ├── index.ts         # loadTextureSet(key), procedural water textures
│   └── sources.ts       # Auto-generated texture paths (from build-model)
└── controls/            # OrbitControls wrapper
    └── orbitControls.ts
```

## Key concepts

- **Model** — any 3D object in the world (ship, avatar, creature, island). Defines geometry, textures, materials, and transform via a `ModelConfig`. Three source types: `extracted` (glTF → hardcoded data files), `procedural` (built in code), `external` (loaded at runtime).
- **SceneEntity** — an object with lifecycle hooks (`onAttach`, `onBeforeUpdate`, `onUpdate`, `onDetach`). The `EntityManager` calls these each frame. Entities are self-contained and communicate via the event bus.
- **Event bus** — decouples entities. Currently 3 events: `entity:attached`, `entity:detached`, `entity:position-changed`.

## Adding a new model

1. Add the external source to `scripts/references.json`
2. Run `npm run model:pull` to download → extract → `.cache/references/`
3. Add the model definition to `scripts/models.json` (mesh naming, transforms, materials)
4. Run `npm run model:build` to copy → rename → generate owned code at `src/models/<id>/`
5. Run `npm run model:compile` to produce a standalone `.glb` at `public/models/<id>.glb`
6. Call `createModel(config)` in code to get a `ModelEntity`

## Pipeline

| Step | Script | Input → Output |
|------|--------|----------------|
| Pull | `npm run model:pull` | Poly Haven → `.cache/references/` (throwaway) |
| Build | `npm run model:build` | `.cache/` → `src/models/<id>/` + `public/textures/<id>/` (owned) |
| Compile | `npm run model:compile` | `src/models/<id>/data/` + textures → `public/models/<id>.glb` (portable) |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run model:pull` | Pull external model references → `.cache/references/` |
| `npm run model:build` | Build owned models from references |
| `npm run model:compile` | Compile owned models to portable `.glb` artifacts |
