# Multi-Location Expansion

## Goal

Add three new location presets (Caribbean, Arctic, Sunset) with distinct environment parameters. Generalize `InstanceState` from ship-specific + buoys/island into a flat record of generic `InstanceDef` entries so any model type (ship, buoy, island, human, dog, cat, flight, …) can be placed per location.

## Architecture

### Instance State Generalization

Replace the rigid `InstanceState` with a flat record:

```ts
interface InstanceDef {
  ref: string                        // model reference (e.g. 'ship', 'buoy', 'island')
  transform: {
    position: [number, number, number]
    rotation: [number, number, number]
    scale: number
  }
  visible: boolean
  materials?: Record<string, MaterialOverride>   // per-mesh overrides (optional)
}

// InstanceState is now a generic record — ship is not special
type InstanceState = Record<string, InstanceDef>
```

Ship was previously special-cased with `ShipInstanceState` (had `material` at the top level). Now `materials` is an optional field on every instance. This means any entity type can carry material overrides — ship, human, dog, cat, flight, furniture, whatever.

### Location Presets

Each location in `LOCATION_PRESETS` (state/worlds.ts) gets environment + instances with the new shape.

```ts
const northSea = {
  environment: { /* sky, ocean, waves, lighting, fog */ },
  instances: {
    ship:   { ref: 'ship',   transform: { position: [0,0,0], rotation: [0,0,0], scale: 2.7 }, visible: true, materials: { hull: {...}, deck: {...}, ... } },
    'buoy-1': { ref: 'buoy',  transform: { position: [60,0,35], rotation: [0,0,0], scale: 1 }, visible: true },
    'buoy-2': { ref: 'buoy',  transform: { position: [-55,0,-25], rotation: [0,0,0], scale: 1 }, visible: true },
    island: { ref: 'island', transform: { position: [-200,0,-150], rotation: [0,0,0], scale: 1 }, visible: true },
  },
}
```

| Location | Sky | Ocean | Lighting | Fog | Instance refs |
|---|---|---|---|---|---|
| north-sea | blue gradient | #2090d0, 0.82 | warm sun 2.8 | exp2 0.0018 | ship, 2× buoy, island |
| caribbean | cyan→orange | #1080b0 | hot sun 3.2 | lighter exp2 | ship, 2× buoy (moved), island (moved) |
| arctic | grey→white | #305060 | dim cool 1.2 | heavy exp2 0.003 | ship, 2× buoy (moved), island (moved) |
| sunset | pink→purple | #c06040 | warm dim 1.8 | warm linear | ship, 2× buoy (moved), island (moved) |

All locations reuse existing `buoy` and `island` models for phase 1. New models (palm-island, ice-floe) are out of scope.

### Instance Manager Entity

New `SceneEntity` (`src/entity/instance-manager.ts`) that manages the lifecycle of all placed instances:

- Receives `modelLoader`, `scene`, `store` at creation
- Subscribes to `instances` (the entire record) in the store
- Maintains a `Map<string, { entity: ModelEntity; instanceId: string }>` of live instances
- On subscription change, diffs current instance IDs vs previous:
  - **Added**: load model from ref, add root to scene, apply transform/visibility
  - **Removed**: remove from scene, dispose model, unload
  - **Existing**: update transform, visibility, materials (if changed)
- Ignores `ship` specially only for the ship entity (which handles its own wave-following). The instance manager still adds/removes the ship model to the scene, but the ship's dynamic position is driven by the ship entity separately.

### Ship Entity Coexistence

The ship entity (`createShipEntity`) continues to exist as a standalone SceneEntity. It receives the ship model root and subscribes to `instances.ship.materials` for material overrides — same as now. The instance manager places the ship model in the scene initially; the ship entity takes over dynamic position on `onUpdate`.

Alternative: The instance manager could own ALL instances including ship, and the ship entity would just subscribe to transform/material changes. But the ship entity's wave-following loop writes to the ship's position every frame — that would fight with the instance manager. So ship stays as a separate entity that the instance manager defers to.

Implementation: the instance manager places the ship model but marks it as "claimed" so the ship entity can take over its root group.

### Preload Strategy

At startup in `main.ts`, scan all `LOCATION_PRESETS` for unique `ref` values across all instances, preload them all upfront. No async loading during location switches.

### Location Switcher Plugin

No changes needed. Already sets `environment` + `instances` on switch — the instance manager subscription picks it up.

### Files Changed

| File | Change |
|---|---|
| `.gitignore` | Un-ignore `docs/superpowers/` |
| `src/state/types.ts` | Remove `ShipInstanceState`, `InstanceState`. Add `InstanceDef` + `InstanceState = Record<string, InstanceDef>` |
| `src/state/defaults.ts` | Update to new `InstanceState` shape |
| `src/state/worlds.ts` | Add caribbean, arctic, sunset presets; update north-sea to new shape |
| `src/entity/index.ts` | Export `createInstanceManager` |
| `src/entity/instance-manager.ts` | New file — reactive instance lifecycle |
| `src/entity/ship-entity.ts` | Update store subscription paths (`instances.ship.materials` → `instances.ship.materials`) |
| `src/main.ts` | Preload all model refs, wire instance manager |
| `src/plugins/inspector/index.ts` | Update instance paths if inspector reads ship materials |
| Test files | Update for new shape |

### Out of Scope

- New 3D models (palm-island, ice-floe, etc.) — phase 1 reuses existing
- Procedural generation of location-specific terrain
- Instance-specific behavior scripts (e.g., dog wags tail)
