# ADR-013: Procedural Textures as Code

## Status
Accepted

## Date
2026-06-29

## Context
The ship_pinnace reference model from Poly Haven ships 41 PBR texture maps (396 MB at 4K) across 7 mesh groups — hull, deck, sails, rigging, details, aft, interior. Each group has 5–7 maps (diffuse, normal, roughness, metalness, arm, alpha).

The project's architectural goal is to own model data as committed code, minimising reliance on external media and binary assets. The existing texture pipeline (download, store in `public/textures/`, load at runtime) was deleted in ADR-002 changes because it coupled the app to external servers and large binary downloads.

The question: how to provide surface detail for the ship without re-introducing heavy media dependencies?

## Decision
Generate all ship textures procedurally from TypeScript using the Canvas2D API at app start. No image files are committed or downloaded.

Each mesh group gets a dedicated pattern function in `src/model/definitions/ship/textures.ts`:

| Group | Pattern | Technique |
|---|---|---|
| hull | Horizontal planks with nail holes, ±8% brightness variation per plank | Canvas2D rectangles + arc |
| deck | Narrow planks, ±12% variation, dark gaps | Canvas2D rectangles |
| sails | Fabric weave cross-hatch + alpha edge fray with sinusoidal noise | Canvas2D lines + pixel buffer |
| rigging | Rope twist (diagonal cross-hatch) | Canvas2D lines |
| details | Rivets + metallic speckle (proportional to material metalness) | Canvas2D arc + random rects |
| interior | Dark panel dividers | Canvas2D strokes |
| aft | Horizontal planks + vertical panel grid | Canvas2D rectangles + strokes |

All textures are 512×512 resolution — adequate for a ship viewed at sailing distance. Tileable (RepeatWrapping) with per-group UV repeat (hull 3×1, deck 2×1, others 1×1).

The textures are applied at runtime in `ship.ts:onAttach`:
1. `generateGroupTextures()` returns `HTMLCanvasElement` objects
2. `scene.createCanvasTexture(canvas)` wraps them as Three.js `CanvasTexture`
3. `ISceneObject.setMeshTexture()` applies them to the corresponding GLB mesh material

### Gate layer changes
Two methods added to `ISceneObject` / `SceneObject`:
- `setMeshTexture(meshName, textureType, texture)` — applies a texture to a mesh's material by name
- `setMeshTextureRepeat(meshName, textureType, repeatX, repeatY)` — sets UV repeat

These follow the gate pattern: the entity layer never imports Three.js directly.

## Alternatives Considered

### Committed downscaled JPG textures
- Pros: Higher visual fidelity, photorealistic wood/rope/fabric detail
- Cons: ~30–50 MB committed binary blobs; textures are opaque — can't diff or refactor; requires external tools to generate; couples app to original reference appearance

### Three.js ProceduralTexture (TSL nodes)
- Pros: GPU-native, shader-level quality, WebGPU path
- Cons: Requires WebGPU; more complex authoring; not yet stable in the three.js version used

### Normal/bump maps from height fields
- Considered but deferred: Canvas2D height maps → Sobel filter → normal map. Not needed at current camera distances.

## Consequences
- **Zero committed texture bytes** — all surface detail defined in ~200 lines of TypeScript
- **Source of truth is code** — patterns are readable, diffable, tunable
- **Resolution dial** — bump from 512 to 1024 by changing two constants; no asset pipeline
- **Graceful degradation** — in headless/test environments, texture generation is a no-op (canvas unavailable)
- **Visual quality ceiling** — Canvas2D patterns are good at game distance but won't match photorealistic reference at inspection distance
- **Startup cost** — 7 canvases at 512×512 are generated once during `onAttach`; negligible (<1 ms per canvas)

## Future Options
- Add procedural normal maps from height-field data (Sobel on canvas pixel buffer)
- Add procedural roughness/metalness maps per group
- Move texture resolution to ModelConfig for per-group control
- Replace Canvas2D with TSL procedural textures when migrating to WebGPU
