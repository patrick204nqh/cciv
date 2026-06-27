import * as THREE from 'three';

export interface OceanGridResult {
  geo: THREE.BufferGeometry;
  baseHeights: Float32Array;
}

export function buildOceanGrid(size: number, seg: number): OceanGridResult {
  const half = size / 2;
  const step = size / seg;
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];

  for (let iz = 0; iz <= seg; iz++) {
    for (let ix = 0; ix <= seg; ix++) {
      verts.push(-half + ix * step, 0, -half + iz * step);
      uvs.push(ix / seg, iz / seg);
    }
  }

  for (let iz = 0; iz < seg; iz++) {
    for (let ix = 0; ix < seg; ix++) {
      const a = iz * (seg + 1) + ix;
      const b = iz * (seg + 1) + ix + 1;
      const c = (iz + 1) * (seg + 1) + ix;
      const d = (iz + 1) * (seg + 1) + ix + 1;
      idx.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const pos = geo.attributes.position.array as Float32Array;
  const baseHeights = new Float32Array(pos.length / 3);
  for (let i = 0; i < pos.length / 3; i++) {
    baseHeights[i] = pos[i * 3 + 1];
  }
  return { geo, baseHeights };
}
