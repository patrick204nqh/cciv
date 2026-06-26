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
│   └── ship/            # CCIV ship: extracted geometry + config.ts
├── ship/                # Convenience aliases (createShip())
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
├── textures/            # Photoscanned PBR texture loading
│   ├── index.ts         # loadTextureSet(key), procedural fallbacks
│   └── sources.ts       # Texture config (file paths, wrapping)
└── controls/            # OrbitControls wrapper
    └── orbitControls.ts
```

## Key concepts

- **Model** — any 3D object in the world (ship, avatar, creature, island). Defines geometry, textures, materials, and transform via a `ModelConfig`. Three source types: `extracted` (glTF → hardcoded data files), `procedural` (built in code), `external` (loaded at runtime).
- **SceneEntity** — an object with lifecycle hooks (`onAttach`, `onBeforeUpdate`, `onUpdate`, `onDetach`). The `EntityManager` calls these each frame. Entities are self-contained and communicate via the event bus.
- **Event bus** — decouples entities. Currently 3 events: `entity:attached`, `entity:detached`, `entity:position-changed`.

## Adding a new model

1. Create `src/models/<id>/config.ts` with a `ModelConfig`
2. Call `createModel(config)` to get a `ModelEntity`
3. Attach it via `entityManager.attach(entity, scene)`

If the model comes from an external glTF/GLB, run the extraction script first (see Pipeline).

## Pipeline

- `scripts/fetch-textures.mjs` — downloads Poly Haven textures, generates `src/textures/sources.ts`
- `scripts/extract-cciv.mjs` — extracts glTF geometry into Float32Array source files (outputs to `src/models/ship/`)
- `scripts/textures.config.json` — texture asset configuration

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
