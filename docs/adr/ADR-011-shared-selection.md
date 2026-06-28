# ADR-011: Shared Selection via Kernel.selectedObject

## Status
Accepted

## Date
2026-06-27

## Context
The gizmo plugin (TransformControls) and the scene graph tree view both need to know which object is selected. Clicking in the 3D viewport should update the tree highlight, and clicking in the tree should attach the transform gizmo. Without shared selection state, each plugin would need to know about the other.

## Decision
Add `selectedObject: THREE.Object3D | null` to the `Kernel` interface and `Kernel` class. Both plugins read and write this single source of truth:

- **Gizmo plugin**: On raycast hit, sets `kernel.selectedObject = hit.object` (or `null` on miss). The TransformControls attachment happens in the same handler.

- **Scene graph plugin**: On tree node click, sets `kernel.selectedObject = clicked.node`, then traverses the scene to find `TransformControls` (by `isTransformControls` flag) and calls `controls.attach()`.

The `selectedObject` field is mutable (not `readonly`) so both plugins can set it.

## Alternatives Considered

### Event bus for selection
- Pros: Decoupled, no interface change
- Cons: Introduces an event type (`entity:selected`) that needs documentation; event payload needs to carry the Object3D reference; listeners need cleanup

### Direct coupling (scene graph imports gizmo controls)
- Pros: Simple for this specific case
- Cons: Creates a dependency direction that's hard to unwind; scene graph shouldn't know about gizmo internals

### Each plugin manages its own selection
- Pros: No shared state
- Cons: Two independent selection states that can get out of sync; clicking in one doesn't update the other

## Consequences
- Kernel interface grows by one field — minimal change for significant benefit
- Three.js Object3D references are valid as long as the object is in the scene (which it always is during a session)
- `selectedObject` is explicitly nullable — `null` means nothing selected
- Scene graph rebuilds on mode switch clear the selection
- No event bus complexity, no cleanup concerns
- The field can be used by future plugins that need selection awareness (property panel, transform inspector)
