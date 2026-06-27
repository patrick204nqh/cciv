# ADR-005: Simulation as Plugin via EntityManager

## Status
Accepted

## Date
2026-06-27

## Context
The ocean waves, ship motion, and spray particles all need per-frame update logic. The `SceneEntity` interface has an `onUpdate(dt)` method for this purpose, and the `EntityManager` has an `update(dt)` method that calls it on all attached entities. However, `entityManager.update()` was never wired into the render loop — the simulation existed in code but never executed.

## Decision
Wire `entityManager.update(dt)` into the render loop through a `simulationPlugin`:

- A `ScenePlugin` with `modes: new Set(['play'])` — only active in play mode
- Its `render(dt)` callback calls `entityManager.update(dt)`
- Registered in `main.ts` alongside other plugins
- Active in play mode only; when in edit mode, simulation freezes

The simulation plugin is the only plugin that uses the `render` callback. Other plugins (gizmos, inspector, snapshot) are frame-independent or event-driven.

## Alternatives Considered

### Direct wiring in Kernel
- Pros: Simple, single call
- Cons: Kernel shouldn't know about EntityManager; tightens coupling in both directions

### Per-entity plugins
- Pros: Granular control over which simulations run
- Cons: 3+ plugins doing the same thing (calling update()); extra boilerplate with no benefit

### Always-on simulation (no mode distinction)
- Pros: Simplest code
- Cons: Simulation runs during editing, interfering with gizmo/transform manipulation; wastes CPU when user is adjusting materials

## Consequences
- Edit mode: simulation frozen, scene is static, user can tweak materials and positions without fighting wave motion
- Play mode: simulation runs, ocean animates, ship bobs, spray emits
- Switching modes: `Kernel.mode` setter calls `onModeSwitch` on all plugins; registry activates/deactivates plugins accordingly
- The mode-toggle button and Tab key switch between modes, giving the user explicit control
- The simulation plugin itself has no state — it delegates entirely to `EntityManager`
