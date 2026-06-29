import type { PrimitiveData, BillboardOptions } from './types';

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
  return len > 0 ? [x / len, y / len, z / len] : [0, 0, 1];
}

export function buildBillboard(options: BillboardOptions): PrimitiveData {
  const { width, height, origin, belly } = options;
  const segW = options.segmentsW ?? 8;
  const segH = options.segmentsH ?? 8;
  const [ox, oy, oz] = origin;

  const vertsW = segW + 1;
  const vertsH = segH + 1;
  const totalVerts = vertsW * vertsH;

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);

  const indices: number[] = [];

  const halfW = width / 2;

  for (let yi = 0; yi < vertsH; yi++) {
    const t = yi / segH;
    const yPos = oy + t * height;

    const bellyFactor = Math.sin(t * Math.PI) * belly;

    for (let xi = 0; xi < vertsW; xi++) {
      const s = xi / segW;
      const xPos = ox - halfW + s * width;
      const zOffset = bellyFactor * (1 - Math.abs(s - 0.5) * 2);

      const vi = yi * vertsW + xi;
      positions[vi * 3] = xPos;
      positions[vi * 3 + 1] = yPos;
      positions[vi * 3 + 2] = oz + zOffset;
      uvs[vi * 2] = s;
      uvs[vi * 2 + 1] = 1 - t;
    }
  }

  for (let yi = 0; yi < segH; yi++) {
    for (let xi = 0; xi < segW; xi++) {
      const a = yi * vertsW + xi;
      const b = a + 1;
      const c = (yi + 1) * vertsW + xi;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
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
