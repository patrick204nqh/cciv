# ADR-006: StateStore with Dotted-Path Subscriptions

## Status
Accepted

## Date
2026-06-27

## Context
The engineering workbench needs a shared state system that:
- Stores the entire app state (environment, instances, locations) in one place
- Supports granular subscriptions so entities can react to specific changes
- Serializes to JSON for snapshot save/load
- Tracks which locations have unsaved changes (dirty tracking)
- Works without a framework (no React, no signals library)

## Decision
Implement `StateStore` with:
- A single `AppState` object as the source of truth
- `get(path?)` returns the value at a dotted path (or full state if no path)
- `set(path, value)` mutates via dotted paths and notifies subscribers
- `subscribe(path, fn)` registers a listener at a path; returns unsubscribe
- Listener matches are bidirectional: notifying `'environment'` also triggers listeners at `'environment.sky'` (parent→child) and vice versa (child→parent)
- Dirty tracking: `set` on `environment.*` or `instances.*` marks the current location as dirty
- `snapshot()` / `restore()` for full state serialization

The typed interface exposes `get<K extends keyof AppState>(path: K)` but internally uses `any` for nested paths since TypeScript can't typecheck dotted paths at the type level.

## Alternatives Considered

### Zustand
- Pros: Battle-tested, selector-based subscriptions, TypeScript-first
- Cons: Adds a dependency; selector pattern is more verbose for our dotted-path use case; we'd still need a wrapper for dirty tracking

### Plain object + event emitter
- Pros: Simple, zero dependencies
- Cons: No path-based mutations; would need to implement path parsing anyway; granular subscriptions require manual wiring

### signals (preact signals, solid signals)
- Pros: Fine-grained reactivity, automatic tracking
- Cons: Adds a dependency; integration pattern differs from our entity lifecycle; overkill for our update frequency (60fps wave updates)

## Consequences
- Dotted paths are convenient but bypass type safety for nested paths. Entities use `as any` casts when reading from store.
- Bidirectional notify matching ensures that setting a parent path (`'instances'`) propagates to child subscribers (`'instances.ship.materials'`), which is critical for the location switcher.
- Dirty tracking enables the location-switcher plugin to show unsaved state without comparing entire objects.
- Zero runtime dependencies for state management.
