# ADR-003: InstanceState as Flat Record for Placed Props

## Status
Accepted

## Date
2026-06-27

## Context
The scene needs multiple placed 3D objects (buoys, islands, trees, ice floes) that change per location. The initial design had a separate `ship` field with typed materials and a generic `placedProps` array for everything else. This created two paths for placing objects and made the ship special.

## Decision
Use a flat `Record<string, InstanceDef>` for ALL instances, including the ship.

```typescript
type InstanceState = Record<string, InstanceDef>

interface InstanceDef {
  ref: string          // model identifier (e.g. 'ship', 'buoy', 'palm-island')
  transform: { position, rotation, scale }
  visible: boolean
  materials?: Record<string, MaterialOverride>  // optional material overrides
}
```

The ship is just one entry among many (`instances.ship`). The `materials` field is optional — buoy and island instances don't need it. The instance manager (`createInstanceManager`) handles all non-claimed IDs by cloning cached models and placing them. The ship entity claims the `'ship'` ID for special wave-following behavior.

## Alternatives Considered

### Separate ship and placed props
- Pros: Ship has typed materials; simple array for other props
- Cons: Two patterns for essentially the same thing; adding materials to a buoy later requires refactoring; location switching needs to handle two data paths

### Array with type discriminator
- Pros: Uniform collection
- Cons: Looking up a specific instance by ID requires array search instead of direct key access

## Consequences
- Adding a new prop type is just adding an entry to the location preset: no code changes, just data
- The ship material inspector uses `instances.ship.materials` directly — same path works regardless of location
- Instance manager is generic: it handles buoys, islands, palm trees, ice floes with the same cloning logic
- The `isClaimed('ship')` check isolates the ship from generic instance management
- Location presets are self-contained: all instances for a location are in one `instances` block
