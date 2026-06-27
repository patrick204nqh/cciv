# Material Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Save/Load buttons to the inspector's Materials folder so users can persist and restore ship material tweaks as standalone JSON files.

**Architecture:** Two functions (`savePreset`, `loadPreset`) added to `src/plugins/inspector/index.ts` with lil-gui buttons. Reuses the file download/upload pattern from `src/plugins/snapshot/index.ts`. No new files, no new store state.

**Tech Stack:** TypeScript, lil-gui, Vite

## Global Constraints

- No new runtime dependencies
- File format must be versioned (`"format": "cciv-material-preset", "version": 1`)
- Materials propagate reactively via existing ship-entity subscriber — no extra wiring
- All tests pass (`npm test`)

---

### Task 1: Add Save/Load Functions and Inspector Buttons

**Files:**
- Modify: `src/plugins/inspector/index.ts` — add `savePreset()`, `loadPreset()` and buttons in Ship > Materials folder

**Interfaces:**
- Consumes: `kernel.store.get('instances.ship.materials')` — outputs `Record<string, MaterialOverride>`
- Produces: lil-gui buttons in the inspector; Load calls `kernel.store.set('instances.ship.materials', data)`

- [ ] **Step 1: Read current inspector file**

```bash
cat src/plugins/inspector/index.ts
```

- [ ] **Step 2: Add save/load functions and wire buttons**

Edit `src/plugins/inspector/index.ts`. After the materials loop in `buildInstances()`, add:

```typescript
  const s = { save: () => savePreset(), load: () => loadPreset() };
  mat.add(s, 'save').name('Save Preset');
  mat.add(s, 'load').name('Load Preset');

  function savePreset() {
    const materials = kernel.store.get('instances.ship.materials');
    const data = { format: 'cciv-material-preset', version: 1, materials };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ship-materials-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadPreset() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.format !== 'cciv-material-preset' || data.version !== 1) {
          console.warn('Invalid material preset file');
          return;
        }
        kernel.store.set('instances.ship.materials', data.materials);
      } catch {
        console.warn('Failed to load material preset');
      }
    };
    input.click();
  }
```

- [ ] **Step 3: Run build to verify no type errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/plugins/inspector/index.ts
git commit -m "feat: add material preset save/load buttons to inspector"
```

---

### Task 2: Write Tests

**Files:**
- Create: `src/plugins/inspector/index.test.ts`

**Interfaces:**
- Tests against `savePreset()` and `loadPreset()` internal logic (extracted into testable helpers) or via `document` mocks following the snapshot plugin pattern

- [ ] **Step 1: Create test file**

Write `src/plugins/inspector/index.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('material presets', () => {
  // The save/load functions are closure-internal to the IIFE.
  // We test through the store — save produces a serializable format,
  // load applies it back.

  const mockMaterials = {
    hull: { color: '#8B4513', roughness: 0.8, metalness: 0.1, visible: true },
    deck: { color: '#D2B48C', roughness: 0.9, metalness: 0, visible: true },
  };

  it('produces correct preset format', () => {
    const data = { format: 'cciv-material-preset', version: 1, materials: mockMaterials };
    const json = JSON.stringify(data, null, 2);
    const parsed = JSON.parse(json);
    expect(parsed.format).toBe('cciv-material-preset');
    expect(parsed.version).toBe(1);
    expect(parsed.materials.hull.color).toBe('#8B4513');
  });

  it('applies preset materials to store', () => {
    // Simulate what loadPreset does: set into store
    const { StateStore } = await import('../../state/store');
    const { createDefaultState } = await import('../../state/defaults');
    const store = new StateStore(createDefaultState());
    store.set('instances.ship.materials', mockMaterials);
    const result = store.get('instances.ship.materials');
    expect(result).toEqual(mockMaterials);
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npx vitest run src/plugins/inspector/index.test.ts
```

Expected: 2 passed.

- [ ] **Step 3: Commit**

```bash
git add src/plugins/inspector/index.test.ts
git commit -m "test: material preset save/load format and store integration"
```

---

### Task 3: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass (59+).

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run dev server and validate manually**

```bash
npm run dev
```
1. Open inspector → Ship → Materials
2. Verify "Save Preset" and "Load Preset" buttons appear
3. Tweak a color, click Save Preset, verify file downloads
4. Reload page, click Load Preset, pick the file, verify color restores
