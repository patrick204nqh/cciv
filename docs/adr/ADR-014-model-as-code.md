# ADR-014: Model as Code — Parametric Definition

## Status
Accepted

## Date
2026-06-29

## Context
The project's original model pipeline stored geometry as Float32Array JS literals in `data/` directories, compiled them into Draco-compressed GLB files at build time, and loaded the GLB at runtime. This worked but had three problems:

1. **Opaque data** — 50K-number float arrays are unreadable. An engineer can't glance at `hull_pos.js` and understand the ship's shape.
2. **Two sources of truth** — geometry existed as both typed arrays (source) and GLB (artifact). The runtime depended on the artifact.
3. **No structural editing** — changing the hull shape required re-extracting from the reference model. There was no way to tweak parameters in code.

## Decision
Replace Float32Array data files with **parametric model definitions** as TypeScript code. Each model has a `model.ts` that describes its geometry using high-level primitives:

```typescript
// model.ts — readable, editable, source of truth
export default {
  groups: {
    hull: {
      type: 'parametric_hull',
      stations: [
        { z: -16.6, halfBreadths: [0, 0, 0, 0, 0, 0, 0, 2.0] },   // bow
        { z: -7.9,  halfBreadths: [0.28, 2.84, 3.76, 3.82, 3.78, 3.49, 3.17, 0] },  // mid
        { z: 16.6,  halfBreadths: [0, 0, 0, 0.28, 0.28, 0, 0, 0] },  // stern
      ],
    },
    deck:  { type: 'extruded', outline: [[-16, 0.3], [0, 4.15], [14, 0.2]], y: 3.5, yHeight: 0.1 },
    sails: { type: 'billboard', width: 7, height: 5.5, origin: [0, 8, 0], belly: 0.6 },
  },
};
```

### Primitives

| Type | Description | Three.js equivalent |
|---|---|---|
| `hull` | Parametric hull surface via station half-breadths | Custom `BufferGeometry` |
| `extruded` | 2D polygon extruded vertically | `ExtrudeGeometry` |
| `billboard` | Rectangular surface with belly/sag | `PlaneGeometry` + vertex displacement |
| `rigging` | Cylinder segments between points | `CylinderGeometry` per segment |
| `lathe` | Profile rotated around Y axis | `LatheGeometry` |

### Hull extraction
The hull is the most complex group (16967 triangles). A one-time extraction script (`scripts/build/extract-hull.ts`) processes the reference mesh via plane-mesh intersection to produce 20 station × 8 height half-breadth tables. This runs once and the result is committed — the raw Float32Arrays are never loaded at runtime.

### Runtime
A new `CodeModelLoader` (`src/model/code-loader.ts`) interprets `model.ts` definitions at app start, calling the appropriate Three.js builder for each group. The `ModelLoaderImpl` tries the code path first; if no `model.ts` exists for a ref, it falls back to the GLB catalog path.

### GLB artifacts
The compile/publish pipeline still produces GLB files for artifact distribution. The runtime no longer depends on them. `npm run dev` works without `npm run setup`.

## Alternatives Considered

### Keep Float32Array data files
- Pros: Exact vertex data, no fidelity loss
- Cons: Opaque, no structural editing, still requires data files

### Keep GLB as runtime format
- Pros: Draco compression, single-file distribution
- Cons: Binary blob dependency, can't inspect/diff/edit, needs build step

## Consequences
- **All model geometry is readable code** — hull stations tell the ship's shape, deck outlines show the deck plan
- **Zero runtime build dependencies** — `npm run dev` immediately works
- **Engineer-friendly editing** — change a station's half-breadth to reshape the hull, add a sail by writing 3 lines
- **Fidelity ceiling** — parametric hull (20 stations × 8 heights) is an approximation of the 16967-triangle reference. Adequate at sailing distance; won't match photorealistic close-ups
- **GLB still available** — for Blender/Unity/Unreal import or CDN distribution
- **Extraction script is one-time** — `extract-hull.ts` won't be needed again unless the reference model changes

## Future Options
- Add more primitive types (`sphere`, `box`, `tube`, `sculpt`)
- Build a visual hull editor (drag stations to reshape)
- Export GLB directly from `model.ts` in the compile pipeline (remove `data/` dependency)
