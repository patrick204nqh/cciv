import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as THREE from 'three';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

export function writeModelData(modelId: string, groups: Record<string, THREE.BufferGeometry>): void {
  const destDir = join(ROOT, 'src', 'model', 'definitions', modelId, 'data');
  mkdirSync(destDir, { recursive: true });

  for (const [groupName, geo] of Object.entries(groups)) {
    if (!geo.attributes.position) {
      console.warn(`  [${modelId}/${groupName}] no position data, skipping`);
      continue;
    }
    geo.computeVertexNormals();

    const pos = Array.from(geo.attributes.position.array as Float32Array);
    const nml = geo.attributes.normal ? Array.from(geo.attributes.normal.array as Float32Array) : [];
    const uv = geo.attributes.uv ? Array.from(geo.attributes.uv.array as Float32Array) : [];
    const idx = geo.index ? Array.from(geo.index.array) : Array.from({ length: pos.length / 3 }, (_, i) => i);

    writeFileSync(join(destDir, `${groupName}_pos.js`), `export const ${groupName}_pos = new Float32Array([${pos.join(',')}]);\n`);
    writeFileSync(join(destDir, `${groupName}_nml.js`), `export const ${groupName}_nml = new Float32Array([${nml.join(',')}]);\n`);
    writeFileSync(join(destDir, `${groupName}_uv.js`),  `export const ${groupName}_uv = new Float32Array([${uv.join(',')}]);\n`);
    writeFileSync(join(destDir, `${groupName}_idx.js`), `export const ${groupName}_idx = new Uint16Array([${idx.join(',')}]);\n`);

    console.log(`  [${modelId}/${groupName}] ${pos.length / 3} verts, ${idx.length / 3} tris`);
  }
}
