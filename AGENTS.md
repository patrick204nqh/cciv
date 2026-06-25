# HMS Beagle Project

## Structure

- **`hms-beagle.html`** — standalone Three.js (r128, CDN) 3D model of HMS Beagle. Open directly in a browser; no build step.
- **`docs/references/Darling_HMS_Beagle_A6739.pdf`** — historical reference for the ship design.
- **`bin/dev`** — Ruby script that clones+updates skill source repos into `.cache/skills/`, then symlinks discovered skills into `.claude/skills/`, `.agents/skills/`, and `.opencode/skills/`. Run after adding a new skill source.
- **`.opencode/node_modules/`** — gitignored via `.opencode/.gitignore` (local plugin dependency for OpenCode).

## Commands

```sh
# Sync skills from remote sources
ruby bin/dev

# Dry-run to preview what would be synced
ruby bin/dev --dry-run
```

## Skill sources (defined in bin/dev)

| Source | Repo |
|---|---|
| superpowers | obra/superpowers |
| impeccable | pbakaus/impeccable |
| agent-skills | addyosmani/agent-skills |
| skills-best-practices | mgechev/skills-best-practices |
| stop-slop | hardikpandya/stop-slop |
| mattpocock-skills | mattpocock/skills |
| threejs-skills | CloudAI-X/threejs-skills |

Add new sources by appending to `SOURCES` in `bin/dev:19-27`.

## Conventions

- Skills are symlinked (not copied). Edit in the cache dir at `.cache/skills/<name>/` if you need to modify an upstream skill.
- The HTML uses inline OrbitControls (no import map). Coordinate convention: Y-up, Z-bow(+), X-starboard(-).
