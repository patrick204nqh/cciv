#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync, createWriteStream, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONFIG_PATH = join(__dirname, 'resources.json');
const TEX_PUBLIC_DIR = join(ROOT, 'public', 'textures');
const SOURCES_PATH = join(ROOT, 'src', 'textures', 'sources.ts');
const API_BASE = 'https://api.polyhaven.com';
const MODEL_CDN = 'https://dl.polyhaven.org/file/ph-assets/Models/gltf';

const COMP_TYPE = {
  5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array,
  5124: Int32Array, 5125: Uint32Array, 5126: Float32Array,
};

const COMP_SIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5124: 4, 5125: 4, 5126: 4 };
const NUM_COMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

const THREE_CONST = { DoubleSide: 2, BackSide: 1, FrontSide: 0 };

const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function downloadFile(url, destPath) {
  if (existsSync(destPath) && statSync(destPath).size > 0) return false;
  const dir = dirname(destPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  return true;
}

function fmtFloat32(arr) {
  const parts = [];
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && i % 8 === 0) parts.push('\n  ');
    parts.push(arr[i].toFixed(6));
    if (i < arr.length - 1) parts.push(', ');
  }
  return parts.join('');
}

function fmtUint16(arr) {
  const parts = [];
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && i % 16 === 0) parts.push('\n  ');
    parts.push(String(arr[i]));
    if (i < arr.length - 1) parts.push(', ');
  }
  return parts.join('');
}

function fmtUint32(arr) {
  const parts = [];
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && i % 12 === 0) parts.push('\n  ');
    parts.push(String(arr[i]));
    if (i < arr.length - 1) parts.push(', ');
  }
  return parts.join('');
}

function argName(attrKey) {
  const map = { POSITION: 'pos', NORMAL: 'nml', TEXCOORD_0: 'uv', TEXCOORD_1: 'uv2' };
  return map[attrKey] || attrKey.toLowerCase();
}

function mapEntries(maps) {
  if (Array.isArray(maps)) return maps.map(m => [m, m]);
  return Object.entries(maps);
}

async function syncTextures() {
  let totalBytes = 0, downloaded = 0, skipped = 0;
  const { resolution, textures } = config;
  const entries = [];

  for (const [name, texCfg] of Object.entries(textures)) {
    const { asset, maps, wrap } = texCfg;
    if (!asset) { console.log(`  Skip ${name}: no asset field`); continue; }
    console.log(`\n  Texture: ${name} (asset: ${asset})`);
    let files;
    try { files = await fetchJson(`${API_BASE}/files/${asset}`); }
    catch (e) { console.warn(`  Cannot fetch ${asset}, using existing files`); continue; }

    const assetDir = join(TEX_PUBLIC_DIR, asset);
    if (!existsSync(assetDir)) mkdirSync(assetDir, { recursive: true });
    const mapPaths = {};

    for (const [localKey, apiKey] of mapEntries(maps)) {
      const resEntry = files[apiKey]?.[resolution];
      if (!resEntry) { console.warn(`  ${apiKey} @ ${resolution} N/A, skip`); continue; }
      const fmt = Object.keys(resEntry).find(f => resEntry[f]?.url);
      const fmtEntry = fmt ? resEntry[fmt] : null;
      if (!fmtEntry) { console.warn(`  ${apiKey} no format available, skip`); continue; }
      const { url, size } = fmtEntry;
      const ext = fmt === 'jpg' ? 'jpg' : fmt;
      const group = apiKey.split('_')[0];
      const groupDir = join(assetDir, group);
      if (!existsSync(groupDir)) mkdirSync(groupDir, { recursive: true });
      const filename = `${localKey}_${resolution}.${ext}`;
      const destPath = join(groupDir, filename);
      console.log(`  ${localKey}: ${(size / 1024 / 1024).toFixed(1)}MB → public/textures/${asset}/${group}/${filename}`);
      const was = await downloadFile(url, destPath);
      if (was) { downloaded++; totalBytes += size; } else skipped++;
      mapPaths[localKey] = `/textures/${asset}/${group}/${filename}`;
    }
    entries.push({ name, asset, maps: mapPaths, wrap });
  }
  return { entries, downloaded, skipped, totalBytes };
}

async function syncModels() {
  const { models } = config;
  let extracted = 0, skipped = 0;

  for (const [modelName, modelCfg] of Object.entries(models)) {
    const { id, resolution, groups, transform } = modelCfg;
    console.log(`\n  Model: ${modelName} (Poly Haven ID: ${id})`);

    const outDir = join(ROOT, 'src', 'models', modelName);
    const dataDir = join(outDir, 'data');
    const pubDir = join(ROOT, 'public', 'models', modelName);
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    if (!existsSync(pubDir)) mkdirSync(pubDir, { recursive: true });

    const gltfUrl = `${MODEL_CDN}/${resolution}/${id}/${id}_${resolution}.gltf`;
    const binUrl = `${MODEL_CDN}/${resolution}/${id}/${id}.bin`;
    const gltfPath = join('/tmp', `ph_${id}_${resolution}.gltf`);
    const binPath = join(pubDir, `${id}.bin`);

    let gltf;
    try {
      const gltfNew = await downloadFile(gltfUrl, gltfPath);
      const binNew = await downloadFile(binUrl, binPath);
      if (gltfNew || binNew) console.log(`  Downloaded glTF + bin`);
      else console.log(`  glTF cached`);
      gltf = JSON.parse(readFileSync(gltfPath, 'utf-8'));
    } catch (e) {
      console.error(`  Failed to download model ${id}: ${e.message}`);
      continue;
    }

    const bin = readFileSync(binPath);
    console.log(`  glTF meshes: ${gltf.meshes.length}, bin size: ${bin.length}, bufferViews: ${gltf.bufferViews.length}`);
    const meshes = gltf.meshes;
    const accessors = gltf.accessors;
    const bufferViews = gltf.bufferViews;
    const nodes = gltf.nodes;
    const meshNames = {};
    for (const node of nodes) {
      if (node.mesh !== undefined) {
        meshNames[node.mesh] = (node.name || `mesh_${node.mesh}`).replace(/^cciv_/, '').replace(new RegExp(`^${id}_`), '');
      }
    }

    const indexTsLines = [
      `// Auto-generated by scripts/sync-resources.mjs`,
      `// Source: Poly Haven ${id} (CC0)`,
      `export interface MeshData {`,
      `  pos: Float32Array;`,
      `  nml: Float32Array;`,
      `  uv: Float32Array;`,
      `  indices: Uint16Array | Uint32Array;`,
      `  hasUV2?: boolean;`,
      `  uv2?: Float32Array;`,
      `}`,
    ];
    const configGroupEntries = [];
    let polyCount = 0;

    for (let mi = 0; mi < meshes.length; mi++) {
      const name = meshNames[mi];
      const prim = meshes[mi].primitives[0];
      const attrs = prim.attributes;
      const idxAcc = accessors[prim.indices];
      const fields = [];

      for (const [attrKey, accIdx] of Object.entries(attrs)) {
        const acc = accessors[accIdx];
        const bv = bufferViews[acc.bufferView];
        const TypedArray = COMP_TYPE[acc.componentType];
        const elemSize = COMP_SIZE[acc.componentType];
        const numComp = NUM_COMP[acc.type];
        const count = acc.count;
        const byteOffset = bv.byteOffset + (acc.byteOffset || 0);
        const byteLength = count * numComp * elemSize;
        if (bin.byteOffset + byteOffset + byteLength > bin.buffer.byteLength) {
          console.error(`  Buffer overflow: offset=${bin.byteOffset + byteOffset}, len=${byteLength}, bufferLen=${bin.buffer.byteLength}`);
          continue;
        }
        const arr = new TypedArray(bin.buffer, bin.byteOffset + byteOffset, count * numComp);
        const aname = argName(attrKey);
        const arrName = `${name}_${aname}`;

        let formatter;
        if (TypedArray === Float32Array) formatter = fmtFloat32;
        else if (TypedArray === Uint16Array) formatter = fmtUint16;
        else if (TypedArray === Uint32Array) formatter = fmtUint32;
        else continue;

        const jsContent = `// ${name} ${attrKey}: ${count}×${numComp} ${TypedArray.name}\n` +
          `export const ${arrName} = new ${TypedArray.name}([\n  ${formatter(arr)}\n]);\n`;
        writeFileSync(join(dataDir, `${arrName}.js`), jsContent);
        fields.push({ fieldName: aname, arrName });
      }

      const idxBv = bufferViews[idxAcc.bufferView];
      const idxTyped = COMP_TYPE[idxAcc.componentType];
      const idxElemSize = COMP_SIZE[idxAcc.componentType];
      const idxByteOffset = idxBv.byteOffset + (idxAcc.byteOffset || 0);
      const idxCount = idxAcc.count;
      const idxEnd = bin.byteOffset + idxByteOffset + idxCount * idxElemSize;
      if (idxEnd > bin.buffer.byteLength) {
        console.error(`  Index buffer overflow: offset=${bin.byteOffset + idxByteOffset}, count=${idxCount}, elemSize=${idxElemSize}, end=${idxEnd}, bufferLen=${bin.buffer.byteLength}`);
        continue;
      }
      const idxArr = new idxTyped(bin.buffer, bin.byteOffset + idxByteOffset, idxCount);
      const idxName = `${name}_idx`;

      let idxFormatter;
      if (idxTyped === Uint16Array) idxFormatter = fmtUint16;
      else if (idxTyped === Uint32Array) idxFormatter = fmtUint32;

      const idxContent = `// ${name} indices: ${idxCount}\n` +
        `export const ${idxName} = new ${idxTyped.name}([\n  ${idxFormatter(idxArr)}\n]);\n`;
      writeFileSync(join(dataDir, `${idxName}.js`), idxContent);

      for (const f of fields) indexTsLines.push(`import { ${f.arrName} } from './data/${f.arrName}.js';`);
      indexTsLines.push(`import { ${idxName} } from './data/${idxName}.js';`);
      indexTsLines.push(`export const ${name}: MeshData = {`);
      for (const f of fields) indexTsLines.push(`  ${f.fieldName}: ${f.arrName},`);
      indexTsLines.push(`  indices: ${idxName},`);
      if (fields.some(f => f.fieldName === 'uv2')) indexTsLines.push(`  hasUV2: true,`);
      indexTsLines.push(`};`);

      const groupCfg = groups?.[name];
      if (groupCfg) {
        configGroupEntries.push(`    { name: '${name}', type: 'extracted',`);
        for (const f of fields) configGroupEntries.push(`      ${f.fieldName}: ${name}.${f.fieldName},`);
        configGroupEntries.push(`      indices: ${name}.indices,`);
        configGroupEntries.push(`      textureKey: '${groupCfg.texture}',`);
        configGroupEntries.push(`    },`);
      }

      polyCount += idxCount / 3;
      extracted++;
    }

    indexTsLines.push(``);
    indexTsLines.push(`export const MODEL_INFO = {`);
    indexTsLines.push(`  name: '${modelName}',`);
    indexTsLines.push(`  source: 'https://polyhaven.com/a/${id}',`);
    indexTsLines.push(`  license: 'CC0',`);
    indexTsLines.push(`  polyCount: ${Math.round(polyCount)},`);
    indexTsLines.push(`};`);


    writeFileSync(join(outDir, 'index.ts'), indexTsLines.join('\n'));

    // Generate config.ts
    const configLines = [
      `// Auto-generated by scripts/sync-resources.mjs`,
      `// Source: Poly Haven ${id} (CC0)`,
      `import type { ModelConfig } from '../../model/types';`,
      `import { ${Object.keys(meshNames).map((n, i) => meshNames[i]).join(', ')} } from './index';`,
      `import * as THREE from 'three';`,
      ``,
      `export const ${modelName}Config: ModelConfig = {`,
      `  id: '${modelName}',`,
      `  source: 'extracted',`,
    ];

    if (transform) {
      if (transform.scale) configLines.push(`  transform: { scale: ${JSON.stringify(transform.scale)} },`);
    }

    configLines.push(`  metadata: {`);
    configLines.push(`    license: 'CC0',`);
    configLines.push(`    sourceUrl: 'https://polyhaven.com/a/${id}',`);
    configLines.push(`    polyCount: ${Math.round(polyCount)},`);
    configLines.push(`  },`);
    configLines.push(`  meshGroups: [`);
    configLines.push(configGroupEntries.join('\n'));
    configLines.push(`  ],`);

    // Material overrides
    if (groups) {
      const overrideEntries = Object.entries(groups)
        .filter(([_, g]) => g.material);
      if (overrideEntries.length > 0) {
        configLines.push(`  materialOverrides: {`);
        for (const [groupName, g] of overrideEntries) {
          const mat = g.material;
          const props = Object.entries(mat).map(([k, v]) => {
            if (typeof v === 'string' && v.startsWith('0x')) return `      ${k}: ${v}`;
            if (k === 'side' && typeof v === 'string' && THREE_CONST[v] !== undefined)
              return `      ${k}: THREE.${v}`;
            return `      ${k}: ${JSON.stringify(v)}`;
          });
          configLines.push(`    ${groupName}: { ${props.join(', ')} },`);
        }
        configLines.push(`  },`);
      }
    }

    configLines.push(`};`);
    writeFileSync(join(outDir, 'config.ts'), configLines.join('\n'));
    console.log(`  Generated ${Object.keys(meshNames).length} mesh groups → src/models/${modelName}/`);
  }
  return { extracted, skipped };
}

function generateSources(entries, res) {
  const lines = [
    `// Auto-generated by scripts/sync-resources.mjs — do not edit manually`,
    `// Resolution: ${res}, Format: jpg`,
    ``,
    `export interface TextureSet {`,
    `  diff: string;`,
    `  nor_gl?: string;`,
    `  rough?: string;`,
    `  metal?: string;`,
    `  ao?: string;`,
    `  disp?: string;`,
    `  alpha?: string;`,
    `  wrapS?: number;`,
    `  wrapT?: number;`,
    `}`,
    ``,
    `export const TEXTURES: Record<string, TextureSet> = {`,
  ];

  for (const { name, maps, wrap } of entries) {
    const { repeatS = 1, repeatT = 1 } = wrap || {};
    const mapEntries = Object.entries(maps)
      .filter(([k]) => !k.startsWith('_'))
      .map(([k, v]) => `    ${k}: '${v}'`);
    const allEntries = [...mapEntries, `    wrapS: ${repeatS}`, `    wrapT: ${repeatT}`];
    lines.push(`  '${name}': {`);
    lines.push(allEntries.join(',\n'));
    lines.push(`  },`);
  }

  lines.push(`};`);
  lines.push(``);
  writeFileSync(SOURCES_PATH, lines.join('\n'));
  console.log(`\nGenerated ${SOURCES_PATH}`);
}

async function main() {
  console.log('Syncing external resources...\n');

  // 1. Sync textures
  console.log('[Textures]');
  const texResult = await syncTextures();

  // 2. Sync models
  console.log(`\n[Models]`);
  let modelResult = { extracted: 0, skipped: 0 };
  if (config.models) modelResult = await syncModels();

  // 3. Write sources.ts
  if (config.textures) {
    generateSources(texResult.entries, config.resolution);
  }

  console.log(`\nDone:`);
  console.log(`  Textures: ${texResult.downloaded} downloaded, ${texResult.skipped} cached`);
  console.log(`  Models:   ${modelResult.extracted} mesh groups extracted`);
}

main().catch(err => { console.error(err); process.exit(1); });
