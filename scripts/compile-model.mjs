#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Document, NodeIO } from '@gltf-transform/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MODELS_CFG = join(__dirname, 'models.json');
const TEXTURES_PATH = join(ROOT, 'src', 'textures', 'sources.ts');

const HEX_COLOR_RX = /^0x([0-9a-fA-F]{6})$/;

async function compileModel(modelName, modelCfg) {
  const { groups, transform } = modelCfg;
  const dataDir = join(ROOT, 'src', 'models', modelName, 'data');
  const texDir = join(ROOT, 'public', 'textures', modelName);
  const outDir = join(ROOT, 'public', 'models');
  mkdirSync(outDir, { recursive: true });

  const doc = new Document();
  const buf = doc.createBuffer();
  const scene = doc.createScene();
  doc.getRoot().setDefaultScene(scene);

  // Parse texture key → { diff, nor_gl, rough, metal, alpha } paths
  const texMap = parseTextureMap(modelName);

  for (const [ourName, groupCfg] of Object.entries(groups)) {
    const { material: matCfg, texture: texKey } = groupCfg;
    const groupDataDir = join(dataDir, ourName);
    if (!existsSync(groupDataDir)) {
      console.warn(`  Data dir missing: ${groupDataDir}, skip`);
      continue;
    }

    // Import geometry data (plain JS modules with Float32Array exports)
    const posMod = await import(groupDataDir + '/pos.js');
    const nmlMod = await import(groupDataDir + '/nml.js');
    const uvMod = await import(groupDataDir + '/uv.js');
    const idxMod = await import(groupDataDir + '/idx.js');

    const pos = posMod[`${ourName}_pos`];
    const nml = nmlMod[`${ourName}_nml`];
    const uv = uvMod[`${ourName}_uv`];
    const indices = idxMod[`${ourName}_idx`];
    const hasUV2 = existsSync(join(groupDataDir, 'uv2.js'));

    // Create accessors
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
      const uv2Mod = await import(groupDataDir + '/uv2.js');
      const uv2 = uv2Mod[`${ourName}_uv2`];
      const accUv2 = doc.createAccessor().setArray(uv2).setType('VEC2');
      prim.setAttribute('TEXCOORD_1', accUv2);
    }

    // Create material
    const mat = doc.createMaterial(ourName).setDoubleSided(false);
    const texPaths = texKey ? texMap[texKey] : null;

    if (texPaths) {
      // Base color (diffuse)
      if (texPaths.diff) {
        const img = readFileSync(join(ROOT, 'public', texPaths.diff));
        const tex = doc.createTexture(`${ourName}_diff`).setImage(img).setMimeType('image/jpeg');
        mat.setBaseColorTexture(tex);
      }
      // Normal map
      if (texPaths.nor_gl) {
        const img = readFileSync(join(ROOT, 'public', texPaths.nor_gl));
        const tex = doc.createTexture(`${ourName}_nor`).setImage(img).setMimeType('image/jpeg');
        mat.setNormalTexture(tex);
      }
      // Roughness / metalness (packed ORM: rough in G, metal in B)
      if (texPaths.rough || texPaths.metal) {
        const rmPath = texPaths.rough || texPaths.metal;
        const img = readFileSync(join(ROOT, 'public', rmPath));
        const tex = doc.createTexture(`${ourName}_orm`).setImage(img).setMimeType('image/jpeg');
        mat.setMetallicRoughnessTexture(tex);
      }
      // Alpha map
      if (texPaths.alpha) {
        const img = readFileSync(join(ROOT, 'public', texPaths.alpha));
        const tex = doc.createTexture(`${ourName}_alpha`).setImage(img).setMimeType('image/jpeg');
        mat.setAlphaMode('MASK').setAlphaCutoff(0.5);
      }
    }

    // Apply material overrides
    if (matCfg) {
      if (matCfg.color && HEX_COLOR_RX.test(matCfg.color)) {
        const hex = parseInt(matCfg.color.slice(2), 16);
        const r = ((hex >> 16) & 0xff) / 255;
        const g = ((hex >> 8) & 0xff) / 255;
        const b = (hex & 0xff) / 255;
        mat.setBaseColorFactor([r, g, b, texPaths?.alpha ? (matCfg.transparent !== false ? 1 : 1) : 1]);
      }
      if (matCfg.roughness != null) mat.setRoughnessFactor(matCfg.roughness);
      if (matCfg.metalness != null) mat.setMetallicFactor(matCfg.metalness);
      if (matCfg.transparent) mat.setAlphaMode('BLEND');
      if (matCfg.alphaTest != null) mat.setAlphaMode('MASK').setAlphaCutoff(matCfg.alphaTest);
      if (matCfg.side === 'DoubleSide') mat.setDoubleSided(true);
    }

    prim.setMaterial(mat);

    const mesh = doc.createMesh(ourName);
    mesh.addPrimitive(prim);

    // Create node with transform
    const node = doc.createNode(ourName);
    node.setMesh(mesh);
    if (transform?.scale != null) {
      const s = transform.scale;
      node.setScale(Array.isArray(s) ? s : [s, s, s]);
    }

    scene.addChild(node);
  }

  // Export GLB
  const outPath = join(outDir, `${modelName}.glb`);
  const io = new NodeIO();
  await io.write(outPath, doc);
  console.log(`  Compiled → ${outPath}`);
}

function parseTextureMap(modelName) {
  if (!existsSync(TEXTURES_PATH)) return {};
  const content = readFileSync(TEXTURES_PATH, 'utf-8');
  // Simple regex-based parser (avoids importing TS module)
  const map = {};
  const blockRx = /'(\w+)':\s*\{([^}]+)\}/g;
  let match;
  while ((match = blockRx.exec(content)) !== null) {
    const key = match[1];
    const body = match[2];
    const texPaths = {};
    const lineRx = /(\w+):\s+'([^']+)'/g;
    let lm;
    while ((lm = lineRx.exec(body)) !== null) {
      texPaths[lm[1]] = lm[2];
    }
    map[key] = texPaths;
  }
  return map;
}

async function main() {
  const models = JSON.parse(readFileSync(MODELS_CFG, 'utf-8'));
  console.log('Compiling models → public/models/\n');
  for (const [name, cfg] of Object.entries(models)) {
    console.log(`[${name}]`);
    await compileModel(name, cfg);
  }
  console.log('\nDone. GLB artifacts are portable — loadable by any 3D engine.');
}

main().catch(err => { console.error(err); process.exit(1); });
