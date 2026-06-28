# Design (locked)

Philosophy, principles, and architectural invariants **locked on 2026-06-28**. Never modify — read before every change.

## Goal

Layered architecture where every unit of code occupies exactly one layer, interfaces between layers are explicit, and the codebase stabilises into a shape that never needs to change — each unit expresses its logic clearly and completely.

## Layers (conceptual)

```
Application code (depends on gate interfaces, not on dependencies directly):
  Kernel         — lifecycle, orchestration, mode switching
  Plugins        — cross-cutting features (HUD, debug, simulation)
  Entities       — game-world objects (ship, ocean, sky, spray, wake)
  Controls       — input handling (keyboard, camera, active-vessel)
  Environment    — wave simulation, procedural textures
  Rendering      — renderer setup, scene graph management

Gate layers (bridge between application and dependencies):
  Scene gate     — wraps the graphics library
  Physics gate   — wraps the physics engine

Dependencies:
  three.js, cannon-es, etc.
```

Application code depends on gate interfaces only — never on dependencies directly. Gate layers adapt external APIs to our vocabulary. Dependencies have no upward imports.

## Golden Rules

1. **One layer per module.** A module orchestrates or wraps, never both. If it wires entities together, it belongs in a plugin or kernel. If it adapts an external library, it belongs in a gate. No module straddles two layers.

2. **Isolate every dependency behind a gate.** Every external library — graphics, physics, audio, networking — sits behind a gate layer. The gate defines interfaces in our vocabulary. The library's types never appear in any public signature. Swapping the library means rewriting the gate only.

3. **No vendor types escape the gate.** Gate interfaces speak our domain language. No `raw` accessors, no escape hatches, no type imports from the library leaking into application code. If the library disappears, the gate interfaces survive unchanged.

4. **No shortcuts across layers.** All communication between application code and external libraries passes through gate interfaces. No direct calls to the library outside the gate. No vendor objects passed upward.

5. **One way to do everything.** Never maintain two implementations of the same concept. When a new approach replaces an old one, delete the old one immediately — hard deletion, no backward compat. Dual paths rot.

6. **Prefer built-in, wrap at gate.** Before writing custom logic, consult the library's documentation. If it provides what you need, expose it through the gate. Reduce custom code to what the library cannot express.

7. **Match the neighbourhood.** When adding code, follow the patterns already established in that layer. If the existing pattern does not fit, do not patch around it — reconsider the architecture shape for the whole layer instead.

8. **Each unit reaches completion.** Every module should reach a point where its interface and logic are clear and complete. After that, its shape never changes. Evolution happens by replacing whole units, not by modifying them.

## Gate Layer Pattern

```
Application Code (entities, controls, plugins, kernel)
          ↕  stable internal interfaces
Gate Layer  (adapts library API to internal interface)
          ↕  encapsulates library
Dependency  (external library)
```

Every gate follows the same structure:
- Define interfaces in our vocabulary with no reference to the library's types
- Implement adapters that wrap the library's types internally
- Export only the interfaces; keep adapter implementations and all library imports internal to the gate
