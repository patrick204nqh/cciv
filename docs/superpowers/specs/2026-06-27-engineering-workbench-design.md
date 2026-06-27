# Engineering Workbench — Architecture & MVP Plan

## Context

The HMS Beagle project is a Three.js ship visualization with a working entity system, asset pipeline (Poly Haven → code → GLB), Gerstner wave simulation, and 6 entities (ocean, sky, lighting, ship, spray, wake). It lacks interactive tooling, animation, and simulation flexibility.

**Goal:** An engineering workbench for iterating on the scene — tweaking parameters, placing models, switching environments, and simulating motion — built as an internal tool, not an end-user product.

## Architecture

### Kernel + Plugin System (C-in-B layout)

A minimal kernel owns what is always present; all features are plugins. This makes extraction into standalone plugins trivial when the project matures.

```
Kernel
  ├── scene (THREE.Scene)
  ├── renderer (THREE.WebGLRenderer)
  ├── camera (THREE.PerspectiveCamera)
  ├── controls (OrbitControls)
  ├── stateStore (StateStore<T>)
  ├── eventBus (existing)
  ├── worldClock (existing)
  ├── pluginRegistry
  └── mode: 'edit' | 'play'

Plugins implement ScenePlugin interface:
  { id, label, modes, priority, init, destroy, onModeSwitch, render }
```

### Two Modes

| Mode | Purpose | Active plugins |
|---|---|---|
| **Edit** | Parameter tweaking, model placement, state snapshots | inspector, gizmos, snapshot, world-switcher |
| **Play** | Simulation, animation, physics | wave-sim, ship-motion, spray, wake |

Mode switch: `Tab` key. Kernel emits `mode:before-switch`, old-mode plugins clean up, new-mode plugins activate.

### State Container

Single source of truth typed state store with dotted-path access and subscriptions:

```ts
interface StateStore<T> {
  get(): T
  get<K>(path: K): T[K]
  set(path: string, value: unknown): void
  set(batch: Record<string, unknown>): void
  subscribe(path: string, fn: (v: unknown) => void): () => void
  snapshot(): T
  restore(snapshot: T): void
}
```

### State Shape

```ts
world {
  time: { speed: number, paused: boolean, elapsed: number }
}
environment {
  waves: {
    type: 'gerstner'
    count: number
    params: { amplitude, frequency, direction, speed, steepness }[]
  }
  sky: {
    type: 'gradient' | 'physical'
    gradient: { topColor, bottomColor, horizonOffset }
  }
  ocean: {
    gridSize: number, extent: number, color: string, opacity: number
  }
  lighting: {
    sun: { enabled, intensity, color, position, shadowMapSize }
    hemisphere: { enabled, skyColor, groundColor, intensity }
    fill: { enabled, intensity, color, position }
    pointLights: { enabled, intensity, color, position, range }[]
  }
  fog: { type: 'exp2' | 'linear', color, density | near, far }
}
models {
  ship: {
    transform: { position: [x,y,z], rotation: [x,y,z], scale: [x,y,z] }
    material: {
      hull: { color, roughness, metalness, visible }
      deck: { color, roughness, metalness, visible }
      sails: { color, roughness, metalness, visible }
      aft: { color, roughness, metalness, visible }
      rigging: { color, roughness, metalness, visible }
      details: { color, roughness, metalness, visible }
      interior: { color, roughness, metalness, visible }
    }
    visible: boolean
  }
  buoys: { id: string, transform, visible }[]
  island: { transform, visible }
}
```

Worlds are pure presets matching this shape:

```ts
// src/state/worlds.ts
interface WorldPreset {
  id: string
  label: string
  environment: EnvironmentState
}
```

Switching worlds loads environment state into the store, triggering a crossfade transition.

## MVP Plugins (First Pass)

| # | Plugin | Details |
|---|---|---|
| 1 | `inspector` | Auto-generated UI from state schema using @lil-gui. Covers wave params, lighting, fog, ship transform, all 7 ship material groups. |
| 2 | `gizmos` | TransformControls on selected entity (raycast-detectable). Click ship → translate/rotate/scale. |
| 3 | `snapshot` | Save current full state to JSON (Ctrl+S). Restore from file dialog. |
| 4 | `world-switcher` | Dropdown in toolbar. Crossfade environment: lerp fog, sky, wave params over 2s. |

## New Files

```
src/kernel.ts                  — Kernel class
src/state/store.ts             — StateStore implementation
src/state/schema.ts            — Default state + editable param metadata
src/state/types.ts             — All state interfaces
src/state/worlds.ts            — World preset definitions
src/plugins/types.ts           — Plugin, Kernel interfaces
src/plugins/registry.ts        — PluginRegistry
src/plugins/inspector/index.ts — lil-gui panel builder
src/plugins/gizmos/index.ts    — TransformControls wrapper
src/plugins/snapshot/index.ts  — JSON save/load
src/plugins/world-switcher/index.ts — Preset loader + crossfade
```

## Modified Files

- `src/main.ts` — bootstrap Kernel, register plugins, set mode
- `src/entity/*.ts` — subscribe to state store instead of hardcoded values
- `src/worlds/north-sea.ts` — convert to pure data preset
- `src/controls/orbitControls.ts` — integrate with mode switching

## Out of Scope (MVP)

- Scene graph tree
- Live-reload / model hot-swap
- Composite model builder
- Per-world layout persistence (snapshot covers this)

## Migration Path to Full Plugin System

Each MVP plugin is already structured as `ScenePlugin`. Extracting to standalone files is trivial when needs grow — no kernel changes required.

## Architectural Decisions

1. **State store over message-passing** — Entities subscribe to their state paths. This decouples producers (UI/sim) from consumers (entities) and makes state serializable by default.

2. **Plugins over monolith** — Even the first pass uses the plugin interface. This prevents the kernel from growing tentacles into every feature.

3. **Worlds as presets, not scenes** — A world is just environment data. Models are registered independently. This lets you swap environments without reloading models, and mix-and-match later.

4. **Two modes, shared state** — Edit and play read/write the same store. This ensures edit-mode tweaks survive mode switches and you can "play" with edited params immediately.
