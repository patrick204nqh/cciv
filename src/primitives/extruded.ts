import type { PrimitiveData, ExtrudedOptions } from './types';

function toIdx(a: number[]): Uint16Array | Uint32Array {
  let max = 0;
  for (let i = 0; i < a.length; i++) if (a[i] > max) max = a[i];
  return max > 65535 ? new Uint32Array(a) : new Uint16Array(a);
}

function cross(ax: number, ay: number, az: number, bx: number, by: number, bz: number): [number, number, number] {
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
}

function normalize(x: number, y: number, z: number): [number, number, number] {
  const len = Math.sqrt(x * x + y * y + z * z);
  return len > 0 ? [x / len, y / len, z / len] : [0, 1, 0];
}

export function buildExtruded(outline: [number, number][], options: ExtrudedOptions): PrimitiveData {
  const { y, yHeight } = options;
  const pts = outline.length;

  const topVerts = pts;
  const bottomVerts = pts;
  const totalVerts = topVerts + bottomVerts;
  const capTris = pts * 2;

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices: number[] = [];

  const minX = Math.min(...outline.map(p => p[0]));
  const maxX = Math.max(...outline.map(p => p[0]));
  const minZ = Math.min(...outline.map(p => p[1]));
  const maxZ = Math.max(...outline.map(p => p[1]));
  const spanX = maxX - minX || 1;
  const spanZ = maxZ - minZ || 1;

  for (let i = 0; i < pts; i++) {
    const [x, z] = outline[i];
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    uvs[i * 2] = (x - minX) / spanX;
    uvs[i * 2 + 1] = (z - minZ) / spanZ;

    const bi = pts + i;
    positions[bi * 3] = x;
    positions[bi * 3 + 1] = y - yHeight;
    positions[bi * 3 + 2] = z;
    uvs[bi * 2] = (x - minX) / spanX;
    uvs[bi * 2 + 1] = (z - minZ) / spanZ;
  }

  for (let i = 0; i < pts; i++) {
    const next = (i + 1) % pts;
    indices.push(i, next, pts + i);
    indices.push(pts + i, next, pts + next);
  }

  for (let i = 1; i < pts - 1; i++) {
    indices.push(0, i + 1, i);
  }

  for (let i = 1; i < pts - 1; i++) {
    const bi = pts + i;
    indices.push(pts, pts + i, pts + i + 1);
  }

  const idxArr = toIdx(indices);

  for (let i = 0; i < idxArr.length; i += 3) {
    const i0 = idxArr[i], i1 = idxArr[i + 1], i2 = idxArr[i + 2];
    const e1 = [
      positions[i1 * 3] - positions[i0 * 3],
      positions[i1 * 3 + 1] - positions[i0 * 3 + 1],
      positions[i1 * 3 + 2] - positions[i0 * 3 + 2],
    ];
    const e2 = [
      positions[i2 * 3] - positions[i0 * 3],
      positions[i2 * 3 + 1] - positions[i0 * 3 + 1],
      positions[i2 * 3 + 2] - positions[i0 * 3 + 2],
    ];
    const [nx, ny, nz] = cross(e1[0], e1[1], e1[2], e2[0], e2[1], e2[2]);
    normals[i0 * 3] += nx; normals[i0 * 3 + 1] += ny; normals[i0 * 3 + 2] += nz;
    normals[i1 * 3] += nx; normals[i1 * 3 + 1] += ny; normals[i1 * 3 + 2] += nz;
    normals[i2 * 3] += nx; normals[i2 * 3 + 1] += ny; normals[i2 * 3 + 2] += nz;
  }

  for (let i = 0; i < totalVerts; i++) {
    const [nx, ny, nz] = normalize(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
    normals[i * 3] = nx;
    normals[i * 3 + 1] = ny;
    normals[i * 3 + 2] = nz;
  }

  return { positions, normals, uvs, indices: idxArr };
}
