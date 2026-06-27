#!/usr/bin/env tsx
import { readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { Document, NodeIO } from '@gltf-transform/core';
import manifest from '../../src/textures/manifest.json';

const ROOT = join(__dirname, '..', '..');
const PROCESSED_DIR = join(ROOT, '.cache', 'processed');
const OUT_DIR = join(ROOT, 'public', 'models');
const HEX_COLOR_RX = /^0x([0-9a-fA-F]{6})$/;
const TEXTURES = manifest as Record<string, Record<string, string>>;

interface GroupConfig {
  material?: Record<string, unknown>;
}

async function compileModel(modelName: string, groups: Record<string, GroupConfig>) {
  const groupDataDir = join(PROCESSED_DIR, modelName);
  if (!existsSync(groupDataDir)) {
    console.warn(`  No processed data for ${modelName}, skipping`);
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const doc = new Document();
  doc.createBuffer();
  const scene = doc.createScene();
  doc.getRoot().setDefaultScene(scene);

  const entries = readdirSync(groupDataDir, { withFileTypes: true });
  const meshGroups = entries.filter(e =>
    e.isDirectory() && existsSync(join(groupDataDir, e.name, 'pos.js'))
  );

  for (const group of meshGroups) {
    const groupDir = join(groupDataDir, group.name);
    const ourName = group.name;

    const posMod = await import(join(groupDir, 'pos.js'));
    const nmlMod = await import(join(groupDir, 'nml.js'));
    const uvMod = await import(join(groupDir, 'uv.js'));
    const idxMod = await import(join(groupDir, 'idx.js'));

    const pos = posMod[`${ourName}_pos`] as Float32Array;
    const nml = nmlMod[`${ourName}_nml`] as Float32Array;
    const uv = uvMod[`${ourName}_uv`] as Float32Array;
    const indices = idxMod[`${ourName}_idx`] as Uint16Array | Uint32Array;
    const hasUV2 = existsSync(join(groupDir, 'uv2.js'));

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
      const uv2Mod = await import(join(groupDir, 'uv2.js'));
      const uv2 = uv2Mod[`${ourName}_uv2`] as Float32Array;
      const accUv2 = doc.createAccessor().setArray(uv2).setType('VEC2');
      prim.setAttribute('TEXCOORD_1', accUv2);
    }

    const mat = doc.createMaterial(ourName).setDoubleSided(false);
    const groupCfg = groups[ourName];
    const texKey = (groupCfg as any)?.texture as string | undefined;
    const texPaths = texKey ? TEXTURES[texKey] : null;

    if (texPaths) {
      if (texPaths.diff) {
        const img = readFileSync(join(ROOT, 'public', texPaths.diff));
        const tex = doc.createTexture(`${ourName}_diff`).setImage(img).setMimeType('image/jpeg');
        mat.setBaseColorTexture(tex);
      }
      if (texPaths.nor_gl) {
        const img = readFileSync(join(ROOT, 'public', texPaths.nor_gl));
        const tex = doc.createTexture(`${ourName}_nor`).setImage(img).setMimeType('image/jpeg');
        mat.setNormalTexture(tex);
      }
      if (texPaths.rough || texPaths.metal) {
        const rmPath = texPaths.rough || texPaths.metal!;
        const img = readFileSync(join(ROOT, 'public', rmPath));
        const tex = doc.createTexture(`${ourName}_orm`).setImage(img).setMimeType('image/jpeg');
        mat.setMetallicRoughnessTexture(tex);
      }
      if (texPaths.alpha) {
        const img = readFileSync(join(ROOT, 'public', texPaths.alpha));
        const tex = doc.createTexture(`${ourName}_alpha`).setImage(img).setMimeType('image/jpeg');
        mat.setAlphaMode('MASK').setAlphaCutoff(0.5);
      }
    }

    if (groupCfg?.material) {
      const matCfg = groupCfg.material;
      if (matCfg.color && typeof matCfg.color === 'string' && HEX_COLOR_RX.test(matCfg.color)) {
        const hex = parseInt(matCfg.color.slice(2), 16);
        const r = ((hex >> 16) & 0xff) / 255;
        const g = ((hex >> 8) & 0xff) / 255;
        const b = (hex & 0xff) / 255;
        mat.setBaseColorFactor([r, g, b, 1]);
      }
      if (matCfg.roughness != null) mat.setRoughnessFactor(Number(matCfg.roughness));
      if (matCfg.metalness != null) mat.setMetallicFactor(Number(matCfg.metalness));
      if (matCfg.transparent) mat.setAlphaMode('BLEND');
      if (matCfg.alphaTest != null) mat.setAlphaMode('MASK').setAlphaCutoff(Number(matCfg.alphaTest));
      if (matCfg.side === 'DoubleSide') mat.setDoubleSided(true);
    }

    prim.setMaterial(mat);
    const mesh = doc.createMesh(ourName);
    mesh.addPrimitive(prim);
    const node = doc.createNode(ourName);
    node.setMesh(mesh);
    scene.addChild(node);
  }

  const outPath = join(OUT_DIR, `${modelName}.glb`);
  const io = new NodeIO();
  await io.write(outPath, doc);
  console.log(`  Compiled \u2192 ${relative(ROOT, outPath)}`);
}

async function main() {
  const modelsCfgPath = join(ROOT, 'scripts', 'models.json');
  const models = JSON.parse(readFileSync(modelsCfgPath, 'utf-8'));

  console.log('Compiling models \u2192 public/models/\n');
  for (const [name, cfg] of Object.entries(models)) {
    console.log(`[${name}]`);
    const groups = (cfg as any).groups as Record<string, GroupConfig>;
    await compileModel(name, groups);
  }
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
