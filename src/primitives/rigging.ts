import type { PrimitiveData, RiggingSegment } from './types';

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

function up(): [number, number, number] {
  return [0, 1, 0];
}

function buildCylinder(fx: number, fy: number, fz: number, tx: number, ty: number, tz: number, radius: number, segments: number): { positions: number[]; normals: number[]; uvs: number[]; indices: number[] } {
  const dx = tx - fx, dy = ty - fy, dz = tz - fz;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 0.001) return { positions: [], normals: [], uvs: [], indices: [] };

  const nx = dx / len, ny = dy / len, nz = dz / len;

  const [ux, uy, uz] = up();
  let ax = uy * nz - uz * ny;
  let ay = uz * nx - ux * nz;
  let az = ux * ny - uy * nx;
  const aLen = Math.sqrt(ax * ax + ay * ay + az * az);
  if (aLen < 0.001) {
    ax = 1; ay = 0; az = 0;
  } else {
    ax /= aLen; ay /= aLen; az /= aLen;
  }

  const [bx, by, bz] = cross(ny, nz, nx, ay, az, ax);

  const seg = Math.max(3, segments ?? 8);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let ring = 0; ring < 2; ring++) {
    const cx = ring === 0 ? fx : tx;
    const cy = ring === 0 ? fy : ty;
    const cz = ring === 0 ? fz : tz;

    for (let i = 0; i < seg; i++) {
      const angle = (i / seg) * Math.PI * 2;
      const ca = Math.cos(angle), sa = Math.sin(angle);

      const rx = ax * ca + bx * sa;
      const ry = ay * ca + by * sa;
      const rz = az * ca + bz * sa;

      positions.push(cx + rx * radius, cy + ry * radius, cz + rz * radius);
      normals.push(rx, ry, rz);
      uvs.push(i / seg, ring);
    }
  }

  const vpr = seg;
  for (let i = 0; i < seg; i++) {
    const next = (i + 1) % seg;
    indices.push(i, vpr + i, next);
    indices.push(next, vpr + i, vpr + next);
  }

  return { positions, normals, uvs, indices };
}

export function buildRigging(segments: RiggingSegment[]): PrimitiveData {
  const allPos: number[] = [];
  const allNml: number[] = [];
  const allUv: number[] = [];
  const allIdx: number[] = [];
  let offset = 0;

  for (const seg of segments) {
    const result = buildCylinder(
      seg.from[0], seg.from[1], seg.from[2],
      seg.to[0], seg.to[1], seg.to[2],
      seg.radius,
      seg.segments ?? 8,
    );
    if (result.positions.length === 0) continue;

    allPos.push(...result.positions);
    allNml.push(...result.normals);
    allUv.push(...result.uvs);
    for (const idx of result.indices) allIdx.push(idx + offset);
    offset += result.positions.length / 3;
  }

  const positions = new Float32Array(allPos);
  const normals = new Float32Array(allNml);
  const uvs = new Float32Array(allUv);

  let maxIdx = 0;
  for (const idx of allIdx) if (idx > maxIdx) maxIdx = idx;
  const indices = maxIdx > 65535 ? new Uint32Array(allIdx) : new Uint16Array(allIdx);

  return { positions, normals, uvs, indices };
}
