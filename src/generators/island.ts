import * as THREE from 'three';

export interface IslandParams {
  radius: number;
  height: number;
  segments: number;
}

function hash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) / 2147483647;
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const n00 = hash(ix, iy), n10 = hash(ix + 1, iy);
  const n01 = hash(ix, iy + 1), n11 = hash(ix + 1, iy + 1);
  return n00 + (n10 - n00) * sx + (n01 - n00) * sy + (n00 - n10 - n01 + n11) * sx * sy;
}

export function generateIsland(params: IslandParams): THREE.BufferGeometry {
  const { radius, height, segments } = params;
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];

  for (let iz = 0; iz <= segments; iz++) {
    for (let ix = 0; ix <= segments; ix++) {
      const u = ix / segments, v = iz / segments;
      const angle = u * Math.PI * 2;
      const dist = v * radius;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const falloff = 1 - Math.min(v / 0.6, 1);
      const noiseVal = smoothNoise(x * 0.05, z * 0.05) * 0.5 + smoothNoise(x * 0.1, z * 0.1) * 0.3;
      const y = (falloff * 0.8 + noiseVal * 0.2) * height;
      verts.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let iz = 0; iz < segments; iz++) {
    for (let ix = 0; ix < segments; ix++) {
      const a = iz * (segments + 1) + ix;
      const b = iz * (segments + 1) + ix + 1;
      const c = (iz + 1) * (segments + 1) + ix;
      const d = (iz + 1) * (segments + 1) + ix + 1;
      idx.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
