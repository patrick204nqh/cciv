# Location Models — Procedural Palm Island & Ice Floe

## Problem

All 4 locations (north-sea, caribbean, arctic, sunset) share the same 3 model
types: ship, buoy, island. There is no visual distinction in the placed props
across locations.

## Design

Two new procedural model generators + their data files + GLB compilation +
instance entries in caribbean and arctic location presets.

### Model: Palm Island

File: `scripts/generators/palm-island.ts`
Model ID: `palm-island`
Mesh groups:

| Group | Shape | Material |
|---|---|---|
| `base` | Flattened sphere with noise displacement, 32×16 segments | Sand (#c2b280) edge, green (#4a7a3a) center |
| `trunk` | Curved cylinder, 8 segments × 8 rings, progressive X-offset per ring | Brown (#5c3a1e) |
| `fronds` | 6 catmull-rom curves extruded into flat ribbon geometry | Green (#2d6a1e) |

### Model: Ice Floe

File: `scripts/generators/ice-floe.ts`
Model ID: `ice-floe`
Mesh groups:

| Group | Shape | Material |
|---|---|---|
| `floe` | Irregular polygon (12 vertices, random radii) extruded with height variation | White (#d0e0e8) |
| `chunks` | 3-5 smaller irregular polygons nearby | White (#b8c8d8) |

### Pipeline

1. Write generators in `scripts/generators/` (new dir)
2. Run `tsx scripts/generate.ts palm-island scripts/generators/palm-island '{}'`
3. Run `tsx scripts/generate.ts ice-floe scripts/generators/ice-floe '{}'`
4. Run `npm run setup` (compiles GLBs + publishes manifest)
5. Create `src/models/palm-island/config.ts` and `src/models/ice-floe/config.ts`

### Location Changes

| Location | Add instances |
|---|---|
| caribbean | `palm-island-1` at [-150, 0, -180], scale 1.0. Replace generic `island` entry. |
| arctic | `ice-floe-1` at [-180, 0, -100], `ice-floe-2` at [-120, 0, -60], scale 1.0. Replace generic `island` entry. |

Other locations (north-sea, sunset) keep their generic island.

### Files Created

| File | Purpose |
|---|---|
| `scripts/generators/palm-island.ts` | Palm island geometry generator |
| `scripts/generators/ice-floe.ts` | Ice floe geometry generator |
| `src/models/palm-island/config.ts` | Model config with material overrides |
| `src/models/ice-floe/config.ts` | Model config with material overrides |
| `src/models/palm-island/data/*.js` | Generated geometry data (4 files) |
| `src/models/ice-floe/data/*.js` | Generated geometry data (4 files) |

### Files Modified

| File | Change |
|---|---|
| `src/state/worlds.ts` | Add palm-island instances to caribbean, ice-floe instances to arctic |
| `public/models/palm-island.glb` | Compiled GLB |
| `public/models/ice-floe.glb` | Compiled GLB |
| `public/models/manifest.json` | Updated catalog |

### Tests

- Verify generators produce valid BufferGeometry (non-empty position/normal/index)
- Verify model compiles without errors
- Verify manifest includes new entries

## Future Work (Not In Scope)

- Ice floe break-up animation
- Wave interaction for floating props
- Coconut harvest state / variant
