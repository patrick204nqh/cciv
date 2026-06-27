# Scene Graph Tree View

## Problem

No way to inspect or navigate the Three.js scene hierarchy. Users must
raycast-click objects blind or look at code to understand what's in the
scene.

## Design

A floating tree panel showing the full `kernel.scene` hierarchy, with linked
selection to the existing gizmo TransformControls.

### Kernel Changes

Add `selectedObject: THREE.Object3D | null` to `Kernel` interface and
`Kernel` class. Default `null`.

### Gizmo Plugin Changes

On raycast hit: set `kernel.selectedObject = hit.object` (or `null` on miss).
One-liner additions to the existing pointerdown handler.

### Scene Graph Plugin

New file: `src/plugins/scene-graph/index.ts`

- Floating DOM panel, positioned top-left
- Collapsible tree of `kernel.scene`, recursively building `<details>` elements
- Each node shows object name (or type if unnamed)
- Click node → set `kernel.selectedObject`, find `TransformControls` in scene, attach
- Selected node gets a highlighted background
- Properties section: name, type, position (x/y/z), visible toggle, children count
- Rebuilds on mode switch via `onModeSwitch` callback

### Files

| File | Change |
|---|---|
| `src/plugins/types.ts` | Add `selectedObject` to Kernel interface |
| `src/kernel.ts` | Add `selectedObject` field |
| `src/plugins/gizmos/index.ts` | Set `kernel.selectedObject` on hit/miss |
| `src/plugins/scene-graph/index.ts` | Create |
| `src/main.ts` | Import + register sceneGraphPlugin |

### Tests

- Plugin identity and modes
- Tree renders scene children
- Click node selects object
- Properties panel shows selected object info
