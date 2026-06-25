# CCIV

Three.js 3D sailing vessel. Built with Vite + TypeScript.

```sh
npm install
npm run dev
```

## Project structure

```
src/
├── main.ts              # Entry point — scene, camera, renderer, animation loop
├── geometry.ts          # Shared helpers (cyl, box, addMesh, line)
├── ship/                # Ship model library (importable via createShip())
│   ├── cciv/            # Extracted vertex data and ship builder
│   └── index.ts         # createShip() — assembles the ship
├── environment/         # Ocean, sky, lighting
├── textures/            # Photoscanned PBR textures + procedural fallbacks
├── materials/           # Shared materials singleton (M)
└── controls/            # OrbitControls from three/addons
```

## Pipeline

- `scripts/fetch-textures.mjs` — downloads Poly Haven textures, generates `src/textures/sources.ts`
- `scripts/extract-cciv.mjs` — extracts glTF geometry into Float32Array source files
- `scripts/textures.config.json` — texture asset configuration
