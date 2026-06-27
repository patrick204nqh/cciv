# Material Presets — File-Based Save/Load

## Problem

Users tweak ship material properties (color, roughness, metalness) in the
inspector. There is no way to save or share those tweaks independently of the
full environment snapshot.

## Design

Two buttons — **Save Preset** / **Load Preset** — inside the existing
inspector's `Ship > Materials` folder. No new plugin, no new state, no new
files.

### Save

Serializes `instances.ship.materials` to a versioned JSON file and triggers a
browser download.

### Load

Opens a file picker, reads the JSON, validates the format header and schema,
then calls `store.set('instances.ship.materials', data)`. The change propagates
reactively through the ship-entity subscriber.

### File Format

```json
{
  "format": "cciv-material-preset",
  "version": 1,
  "materials": {
    "hull": { "color": "#8B4513", "roughness": 0.8, "metalness": 0.1, "visible": true }
  }
}
```

### Files Changed

| File | Change |
|---|---|
| `src/plugins/inspector/index.ts` | Add `savePreset()` / `loadPreset()` functions; add two buttons in Materials folder |

### Tests

| Test | What it verifies |
|---|---|
| Serializes current materials to expected JSON shape | `savePreset()` output matches format |
| Load parses valid file and updates store | `loadPreset()` on mock File → store updated |

## Future Work (Not In Scope)

- Multiple named presets stored in AppState
- Preset auto-completion / dropdown
- Export/import from snapshot plugin

## Validation

`npm test` passes. `npm run dev` — tweak materials, save, reload page, load
preset, verify materials restore.
