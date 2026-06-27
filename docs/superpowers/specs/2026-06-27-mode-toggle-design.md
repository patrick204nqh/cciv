# Mode Toggle Plugin

## Problem

No way to switch between edit and play modes. The Kernel supports both modes
but there's no UI or keyboard shortcut to toggle.

## Design

A `modeTogglePlugin` active in both modes, providing:

1. **Tab key** — toggles `kernel.mode` between `'edit'` and `'play'`
2. **Floating badge** — bottom-right corner shows current mode, click to toggle

### Files

| File | Change |
|---|---|
| `src/plugins/mode-toggle/index.ts` | Create |
| `src/main.ts` | Import + register |

### Plugin

- `id`: `'mode-toggle'`
- `modes`: `new Set(['edit', 'play'])`
- `priority`: 100 (lowest, no dependency on other plugins)

### Tests

- Plugin identity and modes
- Init creates badge element
- Tab key triggers mode toggle
