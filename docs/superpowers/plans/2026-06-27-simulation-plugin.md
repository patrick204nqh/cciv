# Simulation Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `entityManager.update(dt)` into the Kernel render loop via a play-mode plugin so ocean waves, ship motion, and spray particles animate during play mode and freeze during edit mode.

**Architecture:** Single ScenePlugin at `src/plugins/simulation/index.ts` that calls `entityManager.update(dt)` in its `render` callback. Registered in `main.ts` alongside other plugins.

**Tech Stack:** TypeScript, Three.js

## Global Constraints

- Plugin must have `modes: new Set(['play'])` — inactive in edit mode
- Priority 30 (runs after snapshot at 20 and location-switcher at 25)
- `entityManager` imported as singleton from `../../entity/manager`

---

### Task 1: Create Simulation Plugin

**Files:**
- Create: `src/plugins/simulation/index.ts`

- [ ] **Step 1: Write the plugin**

Write `src/plugins/simulation/index.ts`:

```typescript
import type { ScenePlugin } from '../types';
import { entityManager } from '../../entity/manager';

export const simulationPlugin: ScenePlugin = {
  id: 'simulation',
  label: 'Simulation',
  modes: new Set(['play']),
  priority: 30,

  render(dt: number) {
    entityManager.update(dt);
  },

  init() {},
  destroy() {},
};
```

- [ ] **Step 2: Run type check to verify**

```bash
npx tsc --noEmit
```

Expected: no new errors (pre-existing errors only).

- [ ] **Step 3: Commit**

```bash
git add src/plugins/simulation/index.ts
git commit -m "feat: add simulation plugin for play-mode entity updates"
```

---

### Task 2: Register Plugin in main.ts

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Add import and registration**

In `src/main.ts`, add import after the location-switcher import (line 10):

```typescript
import { simulationPlugin } from './plugins/simulation';
```

Add registration after `locationSwitcherPlugin` (line 17):

```typescript
  kernel.registerPlugin(simulationPlugin);
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: register simulation plugin in main"
```

---

### Task 3: Write Tests

**Files:**
- Create: `src/plugins/simulation/index.test.ts`

- [ ] **Step 1: Write test file**

Write `src/plugins/simulation/index.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { simulationPlugin } from './index';

describe('simulationPlugin', () => {
  it('has correct identity', () => {
    expect(simulationPlugin.id).toBe('simulation');
    expect(simulationPlugin.label).toBe('Simulation');
  });

  it('is only active in play mode', () => {
    expect(simulationPlugin.modes.has('play')).toBe(true);
    expect(simulationPlugin.modes.has('edit')).toBe(false);
  });

  it('has priority 30', () => {
    expect(simulationPlugin.priority).toBe(30);
  });

  it('init and destroy are no-ops', () => {
    expect(() => simulationPlugin.init()).not.toThrow();
    expect(() => simulationPlugin.destroy()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx vitest run src/plugins/simulation/index.test.ts
```

Expected: 4 passed.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: 66 tests pass (4 new + 62 existing).

- [ ] **Step 4: Commit**

```bash
git add src/plugins/simulation/index.test.ts
git commit -m "test: simulation plugin identity and mode config"
```

---

### Task 4: Final Verification

- [ ] **Step 1: Full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Manual dev test**

```bash
npm run dev
```

1. Open app — ocean is static, ship doesn't bob (edit mode default) ✓
2. Switch to play mode via kernel mode toggle — ocean waves animate, ship bobs, spray emits ✓
3. Switch back to edit — simulation freezes ✓
