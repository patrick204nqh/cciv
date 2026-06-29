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

    writeFileSync(join(destDir, `${groupName}_pos.json`), JSON.stringify(pos));
    writeFileSync(join(destDir, `${groupName}_nml.json`), JSON.stringify(nml));
    writeFileSync(join(destDir, `${groupName}_uv.json`), JSON.stringify(uv));
    writeFileSync(join(destDir, `${groupName}_idx.json`), JSON.stringify(idx));

    console.log(`  [${modelId}/${groupName}] ${pos.length / 3} verts, ${idx.length / 3} tris`);
  }
}
