import type { PrimitiveData, HullStation, HullOptions } from './types';

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

function subtract(ax: number, ay: number, az: number, bx: number, by: number, bz: number): [number, number, number] {
  return [ax - bx, ay - by, az - bz];
}

function addNormal(normals: Float32Array, i: number, nx: number, ny: number, nz: number): void {
  normals[i * 3] += nx;
  normals[i * 3 + 1] += ny;
  normals[i * 3 + 2] += nz;
}

function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function interpolateLevels(src: number[], target: number): number[] {
  const last = src.length - 1;
  const result: number[] = [];
  for (let i = 0; i < target; i++) {
    const t = (i / (target - 1)) * last;
    const idx = Math.min(Math.floor(t), last - 1);
    const frac = t - idx;
    result.push(lerp(src[idx], src[idx + 1], frac));
  }
  return result;
}

function getStation(arr: HullStation[], i: number): HullStation {
  const idx = Math.max(0, Math.min(arr.length - 1, i));
  return arr[idx];
}

function interpolateStations(a: HullStation, b: HullStation, c: HullStation, d: HullStation, t: number): HullStation {
  const levelCount = a.halfBreadths.length;
  const hb: number[] = [];
  for (let li = 0; li < levelCount; li++) {
    const v = catmullRom(
      getStation([a], 0).halfBreadths[li],
      b.halfBreadths[li],
      c.halfBreadths[li],
      d.halfBreadths[li],
      t,
    );
    hb.push(Math.max(0, Math.round(v * 100) / 100));
  }
  return {
    z: Math.round(catmullRom(a.z, b.z, c.z, d.z, t) * 100) / 100,
    sheerY: Math.round(catmullRom(a.sheerY, b.sheerY, c.sheerY, d.sheerY, t) * 100) / 100,
    keelY: Math.round(catmullRom(a.keelY, b.keelY, c.keelY, d.keelY, t) * 100) / 100,
    halfBreadths: hb,
  };
}

function smoothStations(stations: HullStation[], subdivs: number): HullStation[] {
  if (subdivs <= 1) return stations;
  const result: HullStation[] = [];
  for (let si = 0; si < stations.length - 1; si++) {
    result.push(stations[si]);
    const p0 = getStation(stations, si - 1);
    const p1 = stations[si];
    const p2 = stations[si + 1];
    const p3 = getStation(stations, si + 2);
    for (let j = 1; j <= subdivs; j++) {
      const t = j / (subdivs + 1);
      result.push(interpolateStations(p0, p1, p2, p3, t));
    }
  }
  result.push(stations[stations.length - 1]);
  return result;
}

export function buildHull(stations: HullStation[], options?: HullOptions): PrimitiveData {
  const safe = (n: number) => Math.max(1, Math.round(n));
  const stationSubDivs = safe(options?.stationSubdivisions ?? 1);
  const levelSubDivs = safe(options?.subdivisions ?? 1);
  const smoothSt = stationSubDivs > 1 ? smoothStations(stations, stationSubDivs - 1) : stations;

  const srcLevels = smoothSt[0].halfBreadths.length;
  const m = (srcLevels - 1) * levelSubDivs + 1;
  const n = smoothSt.length;

  const vertsPerRing = m * 2;
  const totalVerts = n * vertsPerRing;

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices: number[] = [];

  const zMin = smoothSt[0].z;
  const zMax = smoothSt[n - 1].z;
  const zRange = zMax - zMin || 1;

  for (let si = 0; si < n; si++) {
    const s = smoothSt[si];
    const zNorm = (s.z - zMin) / zRange;
    const yRange = s.sheerY - s.keelY;
    const hbValues = levelSubDivs > 1 ? interpolateLevels(s.halfBreadths, m) : s.halfBreadths;

    for (let li = 0; li < m; li++) {
      const t = yRange > 0 ? li / (m - 1) : 0;
      const y = s.keelY + t * yRange;
      const hw = hbValues[li];

      const pi = si * vertsPerRing + li;
      const si2 = si * vertsPerRing + (m * 2 - 1 - li);

      positions[pi * 3] = -hw;
      positions[pi * 3 + 1] = y;
      positions[pi * 3 + 2] = s.z;
      uvs[pi * 2] = zNorm;
      uvs[pi * 2 + 1] = t;

      positions[si2 * 3] = hw;
      positions[si2 * 3 + 1] = y;
      positions[si2 * 3 + 2] = s.z;
      uvs[si2 * 2] = zNorm;
      uvs[si2 * 2 + 1] = t;
    }
  }

  const ring = vertsPerRing;

  for (let si = 0; si < n - 1; si++) {
    for (let j = 0; j < ring; j++) {
      const jNext = (j + 1) % ring;

      const a0 = si * ring + j;
      const a1 = si * ring + jNext;
      const b0 = (si + 1) * ring + j;
      const b1 = (si + 1) * ring + jNext;

      indices.push(a0, b0, a1);
      indices.push(a1, b0, b1);
    }
  }

  const idxArr = toIdx(indices);

  for (let i = 0; i < idxArr.length; i += 3) {
    const i0 = idxArr[i];
    const i1 = idxArr[i + 1];
    const i2 = idxArr[i + 2];

    const ax = positions[i0 * 3], ay = positions[i0 * 3 + 1], az = positions[i0 * 3 + 2];
    const bx = positions[i1 * 3], by = positions[i1 * 3 + 1], bz = positions[i1 * 3 + 2];
    const cx = positions[i2 * 3], cy = positions[i2 * 3 + 1], cz = positions[i2 * 3 + 2];

    const e1 = subtract(bx, by, bz, ax, ay, az);
    const e2 = subtract(cx, cy, cz, ax, ay, az);
    const [nx, ny, nz] = cross(e1[0], e1[1], e1[2], e2[0], e2[1], e2[2]);

    addNormal(normals, i0, nx, ny, nz);
    addNormal(normals, i1, nx, ny, nz);
    addNormal(normals, i2, nx, ny, nz);
  }

  for (let i = 0; i < totalVerts; i++) {
    const [nx, ny, nz] = normalize(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
    normals[i * 3] = nx;
    normals[i * 3 + 1] = ny;
    normals[i * 3 + 2] = nz;
  }

  return { positions, normals, uvs, indices: idxArr };
}
