#!/usr/bin/env tsx
// Compile: reads structured geometry data from src/models/<id>/data/ and bakes
// Draco-compressed GLBs. If no data directory exists, the model is skipped
// gracefully — the pipeline never depends on external caches.
//
// Input format: flat files named <group>_<attr>.js exporting typed arrays.
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
const OUT_DIR = join(ROOT, 'public', 'models');
const TEXTURES = manifest as Record<string, Record<string, string>>;

async function compileModel(id: string, config: ModelConfig): Promise<void> {
  const dataDir = join(MODELS_DIR, id, 'data');
  if (!existsSync(dataDir)) {
    return;
  }

  const allFiles = readdirSync(dataDir);
  const posFiles = allFiles.filter(f => f.endsWith('_pos.js'));
  const groups = [...new Set(posFiles.map(f => f.replace(/_pos\.js$/, '')))];

  if (groups.length === 0) return;

  mkdirSync(OUT_DIR, { recursive: true });
  const doc = new Document();
  doc.createBuffer();
  const scene = doc.createScene();
  doc.getRoot().setDefaultScene(scene);

  for (const groupName of groups) {
    const prefix = groupName;
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

    const prim = doc.createPrimitive();
    prim.setAttribute('POSITION', doc.createAccessor().setArray(pos).setType('VEC3'));
    prim.setAttribute('NORMAL', doc.createAccessor().setArray(nml).setType('VEC3'));
    prim.setAttribute('TEXCOORD_0', doc.createAccessor().setArray(uv).setType('VEC2'));
    prim.setIndices(doc.createAccessor().setArray(indices).setType('SCALAR'));

    if (hasUV2) {
      const uv2Mod = await import(join(dataDir, `${prefix}_uv2.js`));
      const uv2 = uv2Mod[`${prefix}_uv2`] as Float32Array;
      prim.setAttribute('TEXCOORD_1', doc.createAccessor().setArray(uv2).setType('VEC2'));
    }

    const mat = doc.createMaterial(groupName).setDoubleSided(false);
    const texKey = config.textureKeys?.[groupName];
    const texPaths = texKey ? TEXTURES[texKey] : null;

    if (texPaths) {
      if (texPaths.diff && existsSync(join(ROOT, 'public', texPaths.diff))) {
        const img = readFileSync(join(ROOT, 'public', texPaths.diff));
        mat.setBaseColorTexture(doc.createTexture(`${groupName}_diff`).setImage(img).setMimeType('image/jpeg'));
      }
      if (texPaths.nor_gl && existsSync(join(ROOT, 'public', texPaths.nor_gl))) {
        const img = readFileSync(join(ROOT, 'public', texPaths.nor_gl));
        mat.setNormalTexture(doc.createTexture(`${groupName}_nor`).setImage(img).setMimeType('image/jpeg'));
      }
      if ((texPaths.rough || texPaths.metal) && existsSync(join(ROOT, 'public', texPaths.rough || texPaths.metal!))) {
        const img = readFileSync(join(ROOT, 'public', texPaths.rough || texPaths.metal!));
        mat.setMetallicRoughnessTexture(doc.createTexture(`${groupName}_orm`).setImage(img).setMimeType('image/jpeg'));
      }
      if (texPaths.alpha && existsSync(join(ROOT, 'public', texPaths.alpha))) {
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

  if (config.transform?.scale != null) {
    const s = config.transform.scale;
    for (const child of scene.listChildren()) {
      child.setScale(Array.isArray(s) ? s : [s, s, s]);
    }
  }

  const outPath = join(OUT_DIR, `${id}.glb`);
  await new NodeIO().write(outPath, doc);
  const size = existsSync(outPath) ? (await import('fs')).statSync(outPath).size : 0;
  const sizeStr = size > 1e6 ? `${(size / 1e6).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`;
  console.log(`  ${id} \u2192 ${relative(ROOT, outPath)} (${groups.length} groups, ${sizeStr})`);
}

async function main(): Promise<void> {
  const modelDirs = readdirSync(MODELS_DIR).filter(d =>
    existsSync(join(MODELS_DIR, d, 'config.ts'))
  );

  mkdirSync(OUT_DIR, { recursive: true });
  console.log('Compiling models \u2192 public/models/\n');

  let compiled = 0;
  for (const id of modelDirs) {
    const config: ModelConfig = (await import(join(MODELS_DIR, id, 'config.ts'))).default;
    const hasData = existsSync(join(MODELS_DIR, id, 'data'));
    if (!hasData) {
      console.log(`  ${id} (no data, using committed GLB)`);
      continue;
    }
    console.log(`[${id}]`);
    await compileModel(id, config);
    compiled++;
  }

  console.log(`\nDone. ${compiled} models compiled, ${modelDirs.length - compiled} skipped (committed GLBs).`);
}

main().catch(err => { console.error(err); process.exit(1); });
