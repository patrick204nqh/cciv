# ADR-002: Plugin System with Mode-Based Activation

## Status
Accepted

## Date
2026-06-27

## Context
The kernel needs a way to extend the scene editor with toggleable tools. Different tools are needed in different modes:
- **Edit mode**: inspector, gizmos, scene graph, snapshot, location switcher
- **Play mode**: simulation (wave physics, ship motion, spray particles)

The kernel should not know about specific tools. Plugins should be self-contained and register themselves with the kernel.

## Decision
A `ScenePlugin` interface with:
- `id` and `label` for identity
- `modes: Set<'edit' | 'play'>` declaring which modes the plugin supports
- `priority: number` for activation order
- `init(kernel)` / `destroy()` lifecycle
- Optional `render(dt)` called every frame when active
- Optional `onModeSwitch(from, to)` called when kernel mode changes

A `PluginRegistry` that:
- Stores all registered plugins
- `getActive(mode)` returns plugins sorted by priority whose `modes` includes the current mode
- Activation/deactivation happens through the kernel's `mode` setter, which calls `onModeSwitch` on all plugins

Plugins use the IIFE (Immediately Invoked Function Expression) pattern for encapsulation — closure variables store internal state rather than class fields.

## Alternatives Considered

### Class-based plugins
- Pros: Traditional OOP, familiar pattern
- Cons: IIFE pattern is more concise for single-instance singletons; classes need `this` binding; the interface is already defined as a plain object shape

### Event-driven plugins (bus-based)
- Pros: Loose coupling via events
- Cons: Makes control flow harder to follow; plugins can't declare their dependencies or priorities; lifecycle is implicit

### No plugin system (all code in Kernel)
- Pros: Simple to start
- Cons: Kernel would need to know about every tool; can't add/remove tools without modifying Kernel; no way to toggle between edit and play modes

## Consequences
- Plugins are self-contained and testable in isolation
- The IIFE pattern means plugins are singleton instances, not classes — matches the single-instance nature of tools
- Mode switching is explicit and centralized in Kernel, making it easy to understand
- Priority-based ordering ensures deterministic activation order (inspector before gizmos, mode-toggle last)
- The `onModeSwitch` hook lets the scene graph plugin rebuild its tree when returning to edit mode
