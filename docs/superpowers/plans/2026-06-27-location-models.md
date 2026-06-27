# Location Models Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add procedural palm-island and ice-floe models with high-detail geometry, compile to GLB, and wire into caribbean/arctic location presets.

**Architecture:** Custom build scripts in `scripts/build/` generate multi-group geometry via Three.js utilities, writing typed-array data files directly into `src/models/<id>/data/`. The existing compile → publish pipeline (`npm run setup`) turns those into GLBs + manifest. Location presets in `worlds.ts` reference the new model IDs.

**Tech Stack:** TypeScript, Three.js (BufferGeometry, SphereGeometry, CylinderGeometry, CatmullRomCurve3, TubeGeometry), @gltf-transform/core

## Global Constraints

- Generators use Three.js runtime (`import * as THREE from 'three'`), run via `tsx`
- Each generator writes data files for one model (multiple mesh groups)
- Data files must match format: `<group>_<attr>.js` exporting typed arrays
- New models get `config.ts` with material overrides
- Location changes only in caribbean and arctic presets
- All existing tests must still pass

---

### Task 1: Create Write Utility and Script Structure

**Files:**
- Create: `scripts/build/_write.ts` — shared helper to write typed-array data files
- Create: `scripts/build/` directory

- [ ] **Step 1: Create `scripts/build/` directory and write utility**

```bash
mkdir -p scripts/build
```

Write `scripts/build/_write.ts`:

```typescript
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as THREE from 'three';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

export function writeModelData(modelId: string, groups: Record<string, THREE.BufferGeometry>): void {
  const destDir = join(ROOT, 'src', 'models', modelId, 'data');
  mkdirSync(destDir, { recursive: true });

  for (const [groupName, geo] of Object.entries(groups)) {
    if (!geo.attributes.position) {
      console.warn(`  [${modelId}/${groupName}] no position data, skipping`);
      continue;
    }
    geo.computeVertexNormals();

    if (!geo.index) {
      console.warn(`  [${modelId}/${groupName}] no index, triangulating`);
      geo.computeVertexNormals(); // redundant but safe
    }

    const pos = Array.from(geo.attributes.position.array as Float32Array);
    const nml = geo.attributes.normal ? Array.from(geo.attributes.normal.array as Float32Array) : [];
    const uv = geo.attributes.uv ? Array.from(geo.attributes.uv.array as Float32Array) : [];
    const idx = geo.index ? Array.from(geo.index.array) : [];

    writeFileSync(join(destDir, `${groupName}_pos.js`), `export const ${groupName}_pos = new Float32Array([${pos.join(',')}]);\n`);
    writeFileSync(join(destDir, `${groupName}_nml.js`), `export const ${groupName}_nml = new Float32Array([${nml.join(',')}]);\n`);
    writeFileSync(join(destDir, `${groupName}_uv.js`),  `export const ${groupName}_uv = new Float32Array([${uv.join(',')}]);\n`);
    writeFileSync(join(destDir, `${groupName}_idx.js`), `export const ${groupName}_idx = new Uint16Array([${idx.join(',')}]);\n`);

    console.log(`  [${modelId}/${groupName}] ${pos.length / 3} verts, ${idx.length / 3} tris`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/build/_write.ts
git commit -m "chore: add build model data write utility"
```

---

### Task 2: Generate Palm Island Model

**Files:**
- Create: `scripts/build/palm-island.ts` — generator
- Create: `src/models/palm-island/config.ts` — model config
- Create: `src/models/palm-island/data/base_pos.js` etc. (4 files)
- Create: `src/models/palm-island/data/trunk_pos.js` etc. (4 files)
- Create: `src/models/palm-island/data/fronds_pos.js` etc. (4 files)
- Create: `src/models/palm-island/data/coconuts_pos.js` etc. (4 files)

- [ ] **Step 1: Write generator script**

Write `scripts/build/palm-island.ts`:

```typescript
import * as THREE from 'three';
import { writeModelData } from './_write';

function generateBase(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const rad = Math.sqrt(x * x + z * z);
    const flatY = y * 0.25;
    const edgeNoise = rad > 3 ? (Math.random() - 0.5) * 0.6 : 0;
    const ringWave = Math.sin(rad * 1.5) * 0.15;
    pos.setXYZ(i, x * (1 + edgeNoise * 0.08), flatY + ringWave + Math.abs(edgeNoise) * 0.2, z * (1 + edgeNoise * 0.08));
  }
  pos.needsUpdate = true;
  return geo;
}

function generateTrunk(): THREE.BufferGeometry {
  const height = 5.5;
  const radial = 10;
  const segments = 10;
  const geo = new THREE.CylinderGeometry(0.2, 0.6, height, radial, segments);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = (y + height / 2) / height;
    const curve = t * t * 1.5;
    const wobble = Math.sin(y * 3) * 0.04;
    pos.setXYZ(i, x + curve + wobble, y, z + Math.cos(y * 2.5) * 0.04);
  }
  pos.needsUpdate = true;
  geo.translate(0, 1.2, 0);
  return geo;
}

function generateFrond(curveOffset: number, tilt: number): THREE.BufferGeometry {
  const length = 3 + Math.random() * 0.8;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(length * 0.3, 0.2, 0.05),
    new THREE.Vector3(length * 0.6, -0.1, 0.1),
    new THREE.Vector3(length, -0.6, 0),
  ]);
  const tube = new THREE.TubeGeometry(curve, 8, 0.06, 4, false);
  const pos = tube.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const taper = 1 - (x / length) * 0.7;
    pos.setXYZ(i, x, y * taper, z * taper);
  }
  pos.needsUpdate = true;
  tube.rotateZ(tilt);
  tube.rotateY(curveOffset);
  return tube;
}

function generateCoconuts(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.2, 8, 6);
  const positions = [
    [0.05, 0.7, 0.15],
    [-0.1, 0.65, -0.1],
    [0.15, 0.5, -0.15],
  ];
  const merged: THREE.BufferGeometry[] = [];
  for (const [dx, dy, dz] of positions) {
    const c = geo.clone();
    c.translate(dx, dy, dz);
    merged.push(c);
  }
  return (THREE as any).BufferGeometryUtils?.mergeGeometries?.(merged) ?? merged[0];
}

function main() {
  console.log('Building palm-island...');
  const base = generateBase();
  const trunk = generateTrunk();

  const frondCount = 7;
  const fronds: THREE.BufferGeometry[] = [];
  for (let i = 0; i < frondCount; i++) {
    const angle = (i / frondCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const tilt = -Math.PI / 2.5 + (Math.random() - 0.5) * 0.3;
    fronds.push(generateFrond(angle, tilt));
  }

  // Position fronds at trunk top
  const trunkTopY = 1.2 + 5.5 / 2;
  const trunkCurve = 1.5;
  for (const f of fronds) {
    f.translate(trunkCurve, trunkTopY, 0);
  }

  const mergedFronds = (THREE as any).BufferGeometryUtils?.mergeGeometries?.(fronds) ?? fronds[0];

  const coconuts = generateCoconuts();
  coconuts.translate(trunkCurve, trunkTopY - 0.1, 0);

  writeModelData('palm-island', {
    base,
    trunk,
    fronds: mergedFronds,
    coconuts,
  });
  console.log('Done.');
}

main();
```

- [ ] **Step 2: Run the generator**

```bash
npx tsx scripts/build/palm-island.ts
```

Expected output: `[palm-island/base] N verts, M tris` etc. for all 4 groups.

- [ ] **Step 3: Create model config**

Write `src/models/palm-island/config.ts`:

```typescript
import type { ModelConfig } from '../../model/types';

export default {
  materialOverrides: {
    base: { color: 0x8b7355, roughness: 0.9, metalness: 0 },
    trunk: { color: 0x5c3a1e, roughness: 0.85, metalness: 0 },
    fronds: { color: 0x2d7a1e, roughness: 0.7, metalness: 0 },
    coconuts: { color: 0x4a3520, roughness: 0.8, metalness: 0 },
  },
} satisfies ModelConfig;
```

- [ ] **Step 4: Compile the model**

```bash
npm run setup
```

Expected: `palm-island → public/models/palm-island.glb (N groups, X.X KB)`

- [ ] **Step 5: Commit**

```bash
git add scripts/build/palm-island.ts src/models/palm-island/ public/models/palm-island.glb public/models/manifest.json
git commit -m "feat: add palm-island procedural model"
```

---

### Task 3: Generate Ice Floe Model

**Files:**
- Create: `scripts/build/ice-floe.ts` — generator
- Create: `src/models/ice-floe/config.ts` — model config
- Create: `src/models/ice-floe/data/floe_pos.js` etc. (4 files)
- Create: `src/models/ice-floe/data/chunks_pos.js` etc. (4 files)

- [ ] **Step 1: Write generator script**

Write `scripts/build/ice-floe.ts`:

```typescript
import * as THREE from 'three';
import { writeModelData } from './_write';

function randomRadius(base: number, variation: number): number {
  return base + (Math.random() - 0.5) * variation;
}

function generateFloe(): THREE.BufferGeometry {
  const verts = 14;
  const baseRadius = 5;
  const points: THREE.Vector2[] = [];
  for (let i = 0; i < verts; i++) {
    const angle = (i / verts) * Math.PI * 2;
    const r = randomRadius(baseRadius, 2.5);
    const jitter = 0.3;
    points.push(new THREE.Vector2(
      Math.cos(angle) * r + (Math.random() - 0.5) * jitter,
      Math.sin(angle) * r + (Math.random() - 0.5) * jitter,
    ));
  }
  const shape = new THREE.Shape(points);
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);

  // Extrude downward with height variation
  const pos = geo.attributes.position;
  const existingCount = pos.count;
  // Duplicate top vertices to bottom with offset
  const newPos: number[] = [];
  const newIdx: number[] = [];
  const thickness = 0.6;

  for (let i = 0; i < existingCount; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const dist = Math.sqrt(x * x + z * z);
    const heightVar = Math.sin(dist * 1.2) * 0.15 + (Math.random() - 0.5) * 0.15;
    // Top vertex (original stays, but with height variation)
    pos.setXYZ(i, x, 0 + heightVar, z);
    // Bottom vertex
    newPos.push(x, -(thickness + heightVar * 0.5), z);
  }

  // Add bottom face
  const bottomStart = existingCount;
  for (let i = 0; i < existingCount; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    newPos.push(x, -(thickness + (Math.sin(Math.sqrt(x * x + z * z) * 1.2) * 0.15 + (Math.random() - 0.5) * 0.15) * 0.5), z);
  }

  // Connect top to bottom with side triangles
  for (let i = 0; i < existingCount; i++) {
    const next = (i + 1) % existingCount;
    // Side quad → two tris
    newIdx.push(i, bottomStart + i, bottomStart + next);
    newIdx.push(i, bottomStart + next, next);
  }

  // Build final geometry
  const finalGeo = new THREE.BufferGeometry();
  const allPos = new Float32Array([...Array.from(pos.array as Float32Array), ...newPos]);
  finalGeo.setAttribute('position', new THREE.BufferAttribute(allPos, 3));
  // Generate UVs
  const uv = new Float32Array(allPos.length / 3 * 2);
  for (let i = 0; i < allPos.length / 3; i++) {
    const x = allPos[i * 3];
    const z = allPos[i * 3 + 2];
    uv[i * 2] = (x / (baseRadius * 1.5) + 1) / 2;
    uv[i * 2 + 1] = (z / (baseRadius * 1.5) + 1) / 2;
  }
  finalGeo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  finalGeo.setIndex(new THREE.BufferAttribute(new Uint16Array([
    ...Array.from(geo.index?.array ?? []),
    ...newIdx,
  ]), 1));

  return finalGeo;
}

function generateChunks(): THREE.BufferGeometry {
  const count = 4;
  const geos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const verts = 5 + Math.floor(Math.random() * 3);
    const r = 0.5 + Math.random() * 1.2;
    const points: THREE.Vector2[] = [];
    for (let j = 0; j < verts; j++) {
      const angle = (j / verts) * Math.PI * 2;
      const radius = r * (0.7 + Math.random() * 0.3);
      points.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
    }
    const shape = new THREE.Shape(points);
    const geo = new THREE.ShapeGeometry(shape);
    const thick = 0.2 + Math.random() * 0.3;
    // Simple extrusion by duplicating
    const pos = geo.attributes.position;
    const count = pos.count;
    const newPos: number[] = [];
    for (let j = 0; j < count; j++) {
      newPos.push(pos.getX(j), pos.getY(j), -thick);
    }
    const idx = geo.index?.array ?? [];
    const sideIdx: number[] = [];
    for (let j = 0; j < count; j++) {
      const next = (j + 1) % count;
      sideIdx.push(j, count + j, count + next);
      sideIdx.push(j, count + next, next);
    }
    const allPos = new Float32Array([...Array.from(pos.array as Float32Array), ...newPos]);
    const finalGeo = new THREE.BufferGeometry();
    finalGeo.setAttribute('position', new THREE.BufferAttribute(allPos, 3));
    const uv = new Float32Array(allPos.length / 3 * 2);
    for (let j = 0; j < allPos.length / 3; j++) {
      uv[j * 2] = (allPos[j * 3] / (r * 1.5) + 1) / 2;
      uv[j * 2 + 1] = (allPos[j * 3 + 1] / (r * 1.5) + 1) / 2;
    }
    finalGeo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    finalGeo.setIndex(new THREE.BufferAttribute(new Uint16Array([...Array.from(idx), ...sideIdx]), 1));
    const radius = 6 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    finalGeo.translate(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    geos.push(finalGeo);
  }
  // Merge all chunks into single geometry
  const merged = (THREE as any).BufferGeometryUtils?.mergeGeometries?.(geos) ?? geos[0];
  return merged;
}

function main() {
  console.log('Building ice-floe...');
  const floe = generateFloe();
  const chunks = generateChunks();
  writeModelData('ice-floe', { floe, chunks });
  console.log('Done.');
}

main();
```

- [ ] **Step 2: Run the generator**

```bash
npx tsx scripts/build/ice-floe.ts
```

Expected output: `[ice-floe/floe] N verts, M tris` and `[ice-floe/chunks] N verts, M tris`.

- [ ] **Step 3: Create model config**

Write `src/models/ice-floe/config.ts`:

```typescript
import type { ModelConfig } from '../../model/types';

export default {
  materialOverrides: {
    floe: { color: 0xd0e0e8, roughness: 0.6, metalness: 0.1 },
    chunks: { color: 0xbfd0d8, roughness: 0.65, metalness: 0.05 },
  },
} satisfies ModelConfig;
```

- [ ] **Step 4: Compile**

```bash
npm run setup
```

Expected: `ice-floe → public/models/ice-floe.glb`

- [ ] **Step 5: Commit**

```bash
git add scripts/build/ice-floe.ts src/models/ice-floe/ public/models/ice-floe.glb public/models/manifest.json
git commit -m "feat: add ice-floe procedural model"
```

---

### Task 4: Wire Models Into Location Presets

**Files:**
- Modify: `src/state/worlds.ts` — add palm-island to caribbean, ice-floe to arctic

- [ ] **Step 1: Update caribbean and arctic instances**

In `src/state/worlds.ts`, replace the `island` entry in caribbean and add ice-floe entry in arctic:

For caribbean, replace:
```typescript
      island: {
        ref: 'island',
        transform: { position: [-150, 0, -180], rotation: [0, 0, 0], scale: 1.2 },
        visible: true,
      },
```

With:
```typescript
      'palm-island-1': {
        ref: 'palm-island',
        transform: { position: [-150, 0, -180], rotation: [0, 0.5, 0], scale: 1 },
        visible: true,
      },
```

For arctic, replace:
```typescript
      island: {
        ref: 'island',
        transform: { position: [-180, 0, -100], rotation: [0, 0, 0], scale: 1 },
        visible: true,
      },
```

With:
```typescript
      'ice-floe-1': {
        ref: 'ice-floe',
        transform: { position: [-180, 0, -100], rotation: [0, 0.3, 0], scale: 1 },
        visible: true,
      },
      'ice-floe-2': {
        ref: 'ice-floe',
        transform: { position: [-120, 0, -60], rotation: [0, 1.2, 0], scale: 0.6 },
        visible: true,
      },
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/state/worlds.ts
git commit -m "feat: wire palm-island into caribbean, ice-floe into arctic"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Verify the GLBs load correctly**

```bash
npm run dev
```

Open browser, switch to caribbean → should see green palm island instead of generic island. Switch to arctic → should see ice floes.

- [ ] **Step 3: Verify manifest includes new entries**

```bash
cat public/models/manifest.json | grep -E 'palm-island|ice-floe'
```

Expected: both model IDs present with `glb` paths.
