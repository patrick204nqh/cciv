# Simulation Plugin — Play-Mode Entity Update

## Problem

Ocean waves, ship motion, and spray particles have per-frame update logic
(`onUpdate` methods) that are never invoked. `entityManager.update(dt)` is not
called from the render loop.

## Design

A single `simulationPlugin` (ScenePlugin) that calls
`entityManager.update(dt)` from its `render` callback. Active only in `'play'`
mode — entity updates run during play, freeze during edit.

### Files

| File | Change |
|---|---|
| `src/plugins/simulation/index.ts` | Create — plugin calling entityManager.update(dt) |
| `src/main.ts` | Import + register simulationPlugin |

### Plugin

- `id`: `'simulation'`
- `modes`: `new Set(['play'])`
- `priority`: 30 (after snapshot/location-switcher)
- `render(dt)`: calls `entityManager.update(dt)`

### Tests

- Verify plugin is registered and active in play mode
- Verify `entityManager.update` is called during render

## Validation

- `npm test` passes
- `npm run dev` — toggle to play mode → ocean animates, ship bobs, spray emits
- Switch back to edit → simulation pauses instantly
