#!/usr/bin/env tsx
import { readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Document, NodeIO } from '@gltf-transform/core';
import manifest from '../../src/textures/manifest.json';
import type { PipelineModelConfig, ExtractedModelDef, ProceduralModelDef } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');
const MODELS_DIR = join(ROOT, 'src', 'models');
const REFS_DIR = join(ROOT, '.cache', 'references');
const OUT_DIR = join(ROOT, 'public', 'models');
const HEX_COLOR_RX = /^0x([0-9a-fA-F]{6})$/;
const TEXTURES = manifest as Record<string, Record<string, string>>;

async function compileExtracted(modelId: string, config: ExtractedModelDef): Promise<void> {
  const refDir = join(REFS_DIR, config.asset);
  if (!existsSync(refDir)) {
    console.warn(`  Reference not found: ${refDir}. Pull it first.`);
    return;
  }

  const dataDir = join(refDir, 'data');
  if (!existsSync(dataDir)) {
    console.warn(`  No data directory in reference: ${dataDir}`);
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const doc = new Document();
  doc.createBuffer();
  const scene = doc.createScene();
  doc.getRoot().setDefaultScene(scene);

  // Discover mesh groups from flat data files: <asset>_<group>_<attr>.js
  const allFiles = readdirSync(dataDir);
  const posFiles = allFiles.filter(f => f.endsWith('_pos.js'));
  const groupNames = [...new Set(posFiles.map(f => {
    const match = f.match(new RegExp(`${config.asset}_(.+)_pos\\.js`));
    return match ? match[1] : null;
  }).filter(Boolean))] as string[];

  for (const ourName of groupNames) {
    const prefix = `${config.asset}_${ourName}`;

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

    const mat = doc.createMaterial(ourName).setDoubleSided(false);
    const texKey = config.textureKeys?.[ourName];
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

    const override = config.materialOverrides?.[ourName];
    if (override) {
      const color = override.color?.toString(16).padStart(6, '0');
      if (color) {
        const hex = parseInt(color, 16);
        const r = ((hex >> 16) & 0xff) / 255;
        const g = ((hex >> 8) & 0xff) / 255;
        const b = (hex & 0xff) / 255;
        mat.setBaseColorFactor([r, g, b, 1]);
      }
      if (override.roughness != null) mat.setRoughnessFactor(override.roughness);
      if (override.metalness != null) mat.setMetallicFactor(override.metalness);
      if (override.transparent) mat.setAlphaMode('BLEND');
      if (override.alphaTest != null) mat.setAlphaMode('MASK').setAlphaCutoff(override.alphaTest);
    }

    prim.setMaterial(mat);
    const mesh = doc.createMesh(ourName);
    mesh.addPrimitive(prim);
    const node = doc.createNode(ourName);
    node.setMesh(mesh);
    scene.addChild(node);
  }

  // Apply model-level transform
  if (config.transform?.scale != null) {
    const s = config.transform.scale;
    const children = scene.listChildren();
    for (const child of children) {
      child.setScale(Array.isArray(s) ? s : [s, s, s]);
    }
  }

  const outPath = join(OUT_DIR, `${modelId}.glb`);
  const io = new NodeIO();
  await io.write(outPath, doc);
  console.log(`  [extracted] ${modelId} \u2192 ${relative(ROOT, outPath)}`);
}

async function compileProcedural(modelId: string, config: ProceduralModelDef): Promise<void> {
  const genPath = join(ROOT, 'src', 'generators', `${config.generator.replace('../../generators/', '')}.ts`);
  if (!existsSync(genPath)) {
    console.warn(`  Generator not found: ${genPath}`);
    return;
  }

  const genMod = await import(genPath);
  const genFnName = Object.keys(genMod).find(k => k.startsWith('generate'));
  if (!genFnName) {
    console.warn(`  No generator function found in ${genPath}`);
    return;
  }

  const geo = genMod[genFnName](config.params);
  if (!geo || !geo.attributes?.position) {
    console.warn(`  Generator ${genFnName} returned invalid geometry`);
    return;
  }

  geo.computeVertexNormals();

  mkdirSync(OUT_DIR, { recursive: true });
  const doc = new Document();
  doc.createBuffer();
  const scene = doc.createScene();
  doc.getRoot().setDefaultScene(scene);

  const pos = geo.attributes.position.array as Float32Array;
  const nml = geo.attributes.normal?.array as Float32Array ?? new Float32Array(pos.length);
  const uv = geo.attributes.uv?.array as Float32Array ?? new Float32Array(pos.length / 3 * 2);
  const indices = geo.index?.array as (Uint16Array | Uint32Array) ?? new Uint16Array(pos.length / 3);

  const accPos = doc.createAccessor().setArray(pos).setType('VEC3');
  const accNml = doc.createAccessor().setArray(nml).setType('VEC3');
  const accUv = doc.createAccessor().setArray(uv).setType('VEC2');
  const accIdx = doc.createAccessor().setArray(indices).setType('SCALAR');

  const prim = doc.createPrimitive();
  prim.setAttribute('POSITION', accPos);
  prim.setAttribute('NORMAL', accNml);
  prim.setAttribute('TEXCOORD_0', accUv);
  prim.setIndices(accIdx);

  const mat = doc.createMaterial(modelId);
  if (config.material) {
    const m = config.material;
    if (m.color) {
      const hex = m.color;
      const r = ((hex >> 16) & 0xff) / 255;
      const g = ((hex >> 8) & 0xff) / 255;
      const b = (hex & 0xff) / 255;
      mat.setBaseColorFactor([r, g, b, 1]);
    }
    if (m.roughness != null) mat.setRoughnessFactor(m.roughness);
    if (m.metalness != null) mat.setMetallicFactor(m.metalness);
  }

  prim.setMaterial(mat);
  const mesh = doc.createMesh(modelId);
  mesh.addPrimitive(prim);
  const node = doc.createNode(modelId);
  node.setMesh(mesh);
  scene.addChild(node);

  const outPath = join(OUT_DIR, `${modelId}.glb`);
  const io = new NodeIO();
  await io.write(outPath, doc);
  console.log(`  [procedural] ${modelId} \u2192 ${relative(ROOT, outPath)}`);
}

async function main(): Promise<void> {
  const modelDirs = readdirSync(MODELS_DIR).filter(d =>
    existsSync(join(MODELS_DIR, d, 'config.ts'))
  );

  mkdirSync(OUT_DIR, { recursive: true });
  console.log('Compiling models → public/models/\n');

  for (const modelId of modelDirs) {
    const configPath = join(MODELS_DIR, modelId, 'config.ts');
    const config: PipelineModelConfig = (await import(configPath)).default;
    console.log(`[${modelId}] (type=${config.type})`);

    switch (config.type) {
      case 'extracted':
        await compileExtracted(modelId, config);
        break;
      case 'procedural':
        await compileProcedural(modelId, config);
        break;
      case 'composite':
        console.warn(`  Composite compilation not yet implemented`);
        break;
    }
  }

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
