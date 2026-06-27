#!/usr/bin/env tsx
// Compile: reads structured geometry data from .cache/models/<id>/ and bakes GLBs.
// Input format: flat files named <group>_<attr>.js exporting Float32Array/Uint16Array.
// One code path for every model — how the data got there is not our concern.

import { readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Document, NodeIO } from '@gltf-transform/core';
import manifest from '../../src/textures/manifest.json';
import type { ModelConfig } from '../../src/model/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');
const MODELS_DIR = join(ROOT, 'src', 'models');
const DATA_DIR = join(ROOT, '.cache', 'models');
const OUT_DIR = join(ROOT, 'public', 'models');
const TEXTURES = manifest as Record<string, Record<string, string>>;

async function compileModel(id: string, config: ModelConfig): Promise<void> {
  const dataDir = join(DATA_DIR, id);
  if (!existsSync(dataDir)) {
    console.warn(`  No data at ${dataDir}, skipping`);
    return;
  }

  // Discover mesh groups from flat files: <group>_pos.js, <group>_nml.js, etc.
  const allFiles = readdirSync(dataDir);
  const posFiles = allFiles.filter(f => f.endsWith('_pos.js'));
  const groups = [...new Set(posFiles.map(f => f.replace(/_pos\.js$/, '')))];

  if (groups.length === 0) {
    console.warn(`  No mesh groups found in ${dataDir}`);
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const doc = new Document();
  doc.createBuffer();
  const scene = doc.createScene();
  doc.getRoot().setDefaultScene(scene);

  for (const groupName of groups) {
    const prefix = `${groupName}`;

    const posPath = join(dataDir, `${prefix}_pos.js`);
    if (!existsSync(posPath)) continue;

    const posMod = await import(posPath);
    const nmlMod = await import(join(dataDir, `${prefix}_nml.js`));
    const uvMod = await import(join(dataDir, `${prefix}_uv.js`));
    const idxMod = await import(join(dataDir, `${prefix}_idx.js`));

    const pos = posMod[`${prefix}_pos`] as Float32Array;
    const nml = nmlMod[`${prefix}_nml`] as Float32Array;
    const uv = uvMod[`${prefix}_uv`] as Float32Array;
    const indices = idxMod[`${prefix}_idx`] as Uint16Array | Uint32Array;
    const hasUV2 = existsSync(join(dataDir, `${prefix}_uv2.js`));

    const accPos = doc.createAccessor().setArray(pos).setType('VEC3');
    const accNml = doc.createAccessor().setArray(nml).setType('VEC3');
    const accUv = doc.createAccessor().setArray(uv).setType('VEC2');
    const accIdx = doc.createAccessor().setArray(indices).setType('SCALAR');

    const prim = doc.createPrimitive();
    prim.setAttribute('POSITION', accPos);
    prim.setAttribute('NORMAL', accNml);
    prim.setAttribute('TEXCOORD_0', accUv);
    prim.setIndices(accIdx);

    if (hasUV2) {
      const uv2Mod = await import(join(dataDir, `${prefix}_uv2.js`));
      const uv2 = uv2Mod[`${prefix}_uv2`] as Float32Array;
      const accUv2 = doc.createAccessor().setArray(uv2).setType('VEC2');
      prim.setAttribute('TEXCOORD_1', accUv2);
    }

    // Material: texture set + overrides
    const mat = doc.createMaterial(groupName).setDoubleSided(false);
    const texKey = config.textureKeys?.[groupName];
    const texPaths = texKey ? TEXTURES[texKey] : null;

    if (texPaths) {
      if (texPaths.diff) {
        const img = readFileSync(join(ROOT, 'public', texPaths.diff));
        mat.setBaseColorTexture(doc.createTexture(`${groupName}_diff`).setImage(img).setMimeType('image/jpeg'));
      }
      if (texPaths.nor_gl) {
        const img = readFileSync(join(ROOT, 'public', texPaths.nor_gl));
        mat.setNormalTexture(doc.createTexture(`${groupName}_nor`).setImage(img).setMimeType('image/jpeg'));
      }
      if (texPaths.rough || texPaths.metal) {
        const img = readFileSync(join(ROOT, 'public', texPaths.rough || texPaths.metal!));
        mat.setMetallicRoughnessTexture(doc.createTexture(`${groupName}_orm`).setImage(img).setMimeType('image/jpeg'));
      }
      if (texPaths.alpha) {
        const img = readFileSync(join(ROOT, 'public', texPaths.alpha));
        doc.createTexture(`${groupName}_alpha`).setImage(img).setMimeType('image/jpeg');
        mat.setAlphaMode('MASK').setAlphaCutoff(0.5);
      }
    }

    const override = config.materialOverrides?.[groupName];
    if (override) {
      if (override.color != null) {
        const hex = override.color;
        mat.setBaseColorFactor([((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255, 1]);
      }
      if (override.roughness != null) mat.setRoughnessFactor(override.roughness);
      if (override.metalness != null) mat.setMetallicFactor(override.metalness);
      if (override.transparent) mat.setAlphaMode('BLEND');
      if (override.alphaTest != null) mat.setAlphaMode('MASK').setAlphaCutoff(override.alphaTest);
    }

    prim.setMaterial(mat);
    const mesh = doc.createMesh(groupName);
    mesh.addPrimitive(prim);
    const node = doc.createNode(groupName);
    node.setMesh(mesh);
    scene.addChild(node);
  }

  // Model-level transform
  if (config.transform?.scale != null) {
    const s = config.transform.scale;
    for (const child of scene.listChildren()) {
      child.setScale(Array.isArray(s) ? s : [s, s, s]);
    }
  }

  const outPath = join(OUT_DIR, `${id}.glb`);
  await new NodeIO().write(outPath, doc);
  console.log(`  ${id} → ${relative(ROOT, outPath)} (${groups.length} groups)`);
}

async function main(): Promise<void> {
  const modelDirs = readdirSync(MODELS_DIR).filter(d =>
    existsSync(join(MODELS_DIR, d, 'config.ts'))
  );

  mkdirSync(OUT_DIR, { recursive: true });
  console.log('Compiling models → public/models/\n');

  for (const id of modelDirs) {
    const config: ModelConfig = (await import(join(MODELS_DIR, id, 'config.ts'))).default;
    console.log(`[${id}]`);
    await compileModel(id, config);
  }

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
