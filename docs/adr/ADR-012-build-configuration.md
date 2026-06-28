# ADR-012: Vite Build Configuration — Chunk Splitting and GLB Hot-Reload

## Status
Accepted

## Date
2026-06-27

## Context
The production build produces a single 688 KB JS chunk containing both application code and the entire Three.js library. This is inefficient for caching — any app code change forces re-download of Three.js. Additionally, during development, GLB model files in `public/models/` are static assets that Vite doesn't watch for hot-reload.

## Decision

### Chunk Splitting
Use `build.rollupOptions.output.manualChunks` to split Three.js into a separate chunk:

```typescript
manualChunks(id) {
  if (id.includes('node_modules/three')) return 'three';
}
```

This produces two chunks:
- `index.js` (~68 KB) — application code
- `three.js` (~620 KB) — Three.js core and addons

The `chunkSizeWarningLimit` is raised to 1000 KB to suppress the false positive warning on the three chunk (Three.js is inherently large and will always exceed 500 KB).

### GLB Hot-Reload
A custom Vite plugin watches `public/models/*.glb` and `public/models/manifest.json` for changes. When a GLB file changes, Vite sends a full page reload to the browser:

```typescript
server.watcher.add('public/models/*.glb');
server.watcher.on('change', (path) => {
  if (path.endsWith('.glb') || path.endsWith('manifest.json')) {
    server.ws.send({ type: 'full-reload', path });
  }
});
```

## Alternatives Considered

### Dynamic import for Three.js addons
- Pros: Further splits addons into separate chunks loaded on demand
- Cons: Adds complexity with async loading; addons like GLTFLoader are needed on startup; minimal benefit for the complexity

### Smart HMR swap (reload model in place)
- Pros: Preserves app state (current location, material tweaks)
- Cons: Requires cache invalidation in ModelLoader, instance refresh in InstanceManager, and scene tree rebuild in SceneGraph plugin — significant complexity for a dev-only feature

### No hot-reload (manual refresh)
- Pros: Zero config
- Cons: Developer must remember to refresh; easy to miss that a model updated

## Consequences
- Three.js chunk is cached by the browser — app code updates don't re-download Three.js
- App chunk drops from 688 KB to 68 KB (19 KB gzipped) — faster updates
- GLB changes trigger a full page reload — simple, reliable, works for any model
- Full reload means app state is lost (location, material tweaks) — mitigated by material presets (file save/load) and location dropdown being one click away
- The hot-reload Vite plugin is dev-only — not included in production builds
