#!/usr/bin/env tsx
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Document, NodeIO } from '@gltf-transform/core';
import { TEXTURES } from '../textures/sources';
import { ROOT, modelDataDir, glbOutPath } from './lib/paths';

const MODELS_CFG = join(ROOT, 'scripts', 'models.json');
const HEX_COLOR_RX = /^0x([0-9a-fA-F]{6})$/;

interface GroupConfig {
  mesh?: string;
  texture?: string;
  material?: Record<string, unknown>;
}

interface ModelConfig {
  displayName?: string;
  source?: string;
  transform?: { scale?: number | [number, number, number] };
  groups: Record<string, GroupConfig>;
}

async function compileModel(modelName: string, modelCfg: ModelConfig) {
  const { groups, transform } = modelCfg;
  const outDir = join(ROOT, 'public', 'models');
  mkdirSync(outDir, { recursive: true });

  const doc = new Document();
  doc.createBuffer();
  const scene = doc.createScene();
  doc.getRoot().setDefaultScene(scene);

  for (const [ourName, groupCfg] of Object.entries(groups)) {
    const { material: matCfg, texture: texKey } = groupCfg;
    const groupDataDir = modelDataDir(modelName) + '/' + ourName;
    if (!existsSync(groupDataDir)) {
      console.warn(`  Data dir missing: ${groupDataDir}, skip`);
      continue;
    }

    const posMod = await import(groupDataDir + '/pos.js');
    const nmlMod = await import(groupDataDir + '/nml.js');
    const uvMod = await import(groupDataDir + '/uv.js');
    const idxMod = await import(groupDataDir + '/idx.js');

    const pos = posMod[`${ourName}_pos`] as Float32Array;
    const nml = nmlMod[`${ourName}_nml`] as Float32Array;
    const uv = uvMod[`${ourName}_uv`] as Float32Array;
    const indices = idxMod[`${ourName}_idx`] as Uint16Array | Uint32Array;
    const hasUV2 = existsSync(join(groupDataDir, 'uv2.js'));

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
      const uv2 = uv2Mod[`${ourName}_uv2`] as Float32Array;
      const accUv2 = doc.createAccessor().setArray(uv2).setType('VEC2');
      prim.setAttribute('TEXCOORD_1', accUv2);
    }

    // Create material — import TEXTURES directly instead of regex-parsing sources.ts
    const mat = doc.createMaterial(ourName).setDoubleSided(false);
    const texPaths = texKey ? (TEXTURES as Record<string, Record<string, string>>)[texKey] : null;

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
        const rmPath = texPaths.rough || texPaths.metal;
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

    if (matCfg) {
      if (matCfg.color && typeof matCfg.color === 'string' && HEX_COLOR_RX.test(matCfg.color)) {
        const hex = parseInt(matCfg.color.slice(2), 16);
        const r = ((hex >> 16) & 0xff) / 255;
        const g = ((hex >> 8) & 0xff) / 255;
        const b = (hex & 0xff) / 255;
        mat.setBaseColorFactor([r, g, b, texPaths?.alpha ? 1 : 1]);
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
    if (transform?.scale != null) {
      const s = transform.scale;
      node.setScale(Array.isArray(s) ? s : [s, s, s]);
    }

    scene.addChild(node);
  }

  const outPath = glbOutPath(modelName);
  const io = new NodeIO();
  await io.write(outPath, doc);
  console.log(`  Compiled → ${outPath}`);
}

async function main() {
  const models = JSON.parse(readFileSync(MODELS_CFG, 'utf-8')) as Record<string, ModelConfig>;
  console.log('Compiling models → public/models/\n');
  for (const [name, cfg] of Object.entries(models)) {
    console.log(`[${name}]`);
    await compileModel(name, cfg);
  }
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
