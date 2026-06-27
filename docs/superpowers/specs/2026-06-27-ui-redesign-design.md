# UI/UX Redesign — CCIV The Vessel

## Register

product (dual-mode: editor + viewer)

## Purpose

A dual-mode 3D environment viewer: **edit mode** for developers to tweak scenes, objects, and environments; **play mode** for viewers to experience a cinematic atmospheric ship scene.

## Design Approach

Stormy/dramatic nautical theme. Edit mode is functional dark-tooling. Play mode is atmospheric minimalism.

### Edit Mode

- **Single collapsible left sidebar** (~280px) groups all dev tools: Scene Graph, Inspector (lil-gui), Location Switcher, Performance HUD, Snapshot controls
- Dark slate surfaces (#1a2233) on near-black bg (#0a0e18)
- Gold/amber accent (#c8a94e) for active/highlight states
- Monospace + system-ui for data; serif for labels
- Gizmos remain as in-scene interactive controls

### Play Mode

- All edit panels hidden, sidebar slides out
- **Ship's Log HUD** — bottom-left, semi-transparent panel with atmospheric data:
  - Wind speed & direction
  - Swell height
  - Time of day / lighting
  - Heading
- **Ship ID** — top-left, small serif "CCIV · THE VESSEL" with gold accent
- **Controls hint** — bottom-center, fades after 5s
- **Mode badge** — bottom-right, subtle glowing indicator

### Color Palette (OKLCH)

| Token | Value | Usage |
|---|---|---|
| bg | oklch(0.08 0.02 260) | Body background |
| surface | oklch(0.15 0.03 260) | Panel/sidebar surfaces |
| surface-hover | oklch(0.2 0.04 260) | Hover states |
| accent | oklch(0.7 0.15 85) | Gold/brass accents |
| ink | oklch(0.85 0.02 260) | Body text |
| ink-muted | oklch(0.55 0.03 260) | Secondary text |
| danger | oklch(0.45 0.12 30) | Alert/destructive (rust red) |
| hud-bg | oklch(0.05 0.01 260 / 0.85) | HUD overlay bg |
| border | oklch(0.25 0.04 260) | Panel borders |

### Typography

- Headings: Georgia, serif — nautical character
- Data: monospace — precision feel
- UI labels: system-ui — performance, readability
- Body line length: no constraint (data overlays, not prose)

### Motion

- Sidebar: slides left/right on mode toggle, 400ms ease-out-expo
- HUD: fades in over 800ms on play mode enter
- Controls hint: fades after 5s, 1s fade-out
- Reduced motion: `@media (prefers-reduced-motion: reduce)` — all transitions instant

### Accessibility

- All text meets WCAG AA (4.5:1 body, 3:1 large)
- Keyboard navigable (Tab toggles mode)
- `prefers-reduced-motion` respected
- Ship's Log data has sufficient contrast against any 3D bg via glow/drop-shadow
