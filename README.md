# HMS Beagle

Procedural Three.js 3D model of HMS Beagle in her 1831 survey refit configuration. Built with Vite + TypeScript.

```sh
npm install
npm run dev
```

Based on the Lois Darling hull lines and sail plan reconstruction (1982) and FitzRoy's *Narrative*.

## Project structure

```
src/
├── main.ts              # Entry point — scene, camera, renderer, animation loop
├── geometry.ts          # Shared helpers (cyl, box, addMesh, line)
├── ship/                # Ship model library (importable via createShip())
│   ├── hull.ts, deck.ts, masts.ts, sails.ts
│   ├── rigging.ts, cannons.ts, deckDetails.ts, boats.ts
│   └── index.ts         # createShip() — assembles all sub-modules
├── environment/         # Ocean, sky, lighting
├── textures/            # Procedural canvas textures (copper, deck)
├── materials/           # Shared materials singleton (M)
└── controls/            # OrbitControls from three/addons
```

## Reference

- `docs/references/Darling_HMS_Beagle_A6739.pdf`
