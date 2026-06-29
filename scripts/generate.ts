#!/usr/bin/env tsx
// Run a procedural generator and write structured data to src/model/definitions/<id>/data/.
// Usage: tsx scripts/generate.ts <model-id> <generator-module> '<json-params>'
// Example: tsx scripts/generate.ts buoy ../src/generators/buoy '{"height":3,"radius":0.8,"poleHeight":1.5}'

import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: tsx scripts/generate.ts <model-id> <generator-module> <json-params>');
    process.exit(1);
  }

  const [modelId, genModule, paramsJson] = args;
  const params = JSON.parse(paramsJson);

  const genMod = await import(join(ROOT, genModule));
  const genFnName = Object.keys(genMod).find(k => k.startsWith('generate'));
  if (!genFnName) {
    console.error(`No generator function found in ${genModule}`);
    process.exit(1);
  }

  console.log(`Generating '${modelId}' with ${genFnName}...`);
  const geo = genMod[genFnName](params);
  if (!geo?.attributes?.position) {
    console.error('Generator returned invalid geometry');
    process.exit(1);
  }

  geo.computeVertexNormals();

  const destDir = join(ROOT, 'src', 'model', 'definitions', modelId, 'data');
  mkdirSync(destDir, { recursive: true });

  const pos = Array.from(geo.attributes.position.array as Float32Array);
  const nml = geo.attributes.normal ? Array.from(geo.attributes.normal.array as Float32Array) : [];
  const uv = geo.attributes.uv ? Array.from(geo.attributes.uv.array as Float32Array) : [];
  const idx = geo.index ? Array.from(geo.index.array) : [];

  writeFileSync(join(destDir, `${modelId}_pos.json`), JSON.stringify(pos));
  writeFileSync(join(destDir, `${modelId}_nml.json`), JSON.stringify(nml));
  writeFileSync(join(destDir, `${modelId}_uv.json`), JSON.stringify(uv));
  writeFileSync(join(destDir, `${modelId}_idx.json`), JSON.stringify(idx));

  console.log(`  ${destDir}/${modelId}_pos.json (${pos.length / 3} vertices)`);
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
