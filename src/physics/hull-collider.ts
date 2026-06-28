import type { TrimeshShape, ConvexHullShape } from './types';

export interface HullCollider {
  asTrimesh(): TrimeshShape;
  asConvexHull(): ConvexHullShape;
}

export function createHullCollider(
  positions: Float32Array,
  indices: Uint16Array | Uint32Array,
): HullCollider {
  return {
    asTrimesh: () => ({
      type: 'trimesh',
      positions,
      indices,
    }),
    asConvexHull: () => computeConvexHull(positions),
  };
}

const EPS = 1e-8;

function cross(ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
  return { x: ay * bz - az * by, y: az * bx - ax * bz, z: ax * by - ay * bx };
}

function dot(ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
  return ax * bx + ay * by + az * bz;
}

function sub(ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
  return { x: ax - bx, y: ay - by, z: az - bz };
}

function len2(x: number, y: number, z: number) {
  return x * x + y * y + z * z;
}

interface TriFace {
  a: number; b: number; c: number;
  nx: number; ny: number; nz: number;
  d: number;
}

function buildFace(a: number, b: number, c: number, pts: Float32Array): TriFace {
  const ax = pts[a * 3], ay = pts[a * 3 + 1], az = pts[a * 3 + 2];
  const bx = pts[b * 3], by = pts[b * 3 + 1], bz = pts[b * 3 + 2];
  const cx = pts[c * 3], cy = pts[c * 3 + 1], cz = pts[c * 3 + 2];
  const ab = sub(bx, by, bz, ax, ay, az);
  const ac = sub(cx, cy, cz, ax, ay, az);
  const n = cross(ab.x, ab.y, ab.z, ac.x, ac.y, ac.z);
  const nl = Math.sqrt(len2(n.x, n.y, n.z));
  const nx = n.x / nl, ny = n.y / nl, nz = n.z / nl;
  return { a, b, c, nx, ny, nz, d: -(nx * ax + ny * ay + nz * az) };
}

function distToFace(px: number, py: number, pz: number, f: TriFace) {
  return f.nx * px + f.ny * py + f.nz * pz + f.d;
}

function furthestOutside(face: TriFace, candidates: number[], pts: Float32Array): { idx: number; dist: number } | null {
  let best = -1;
  let bestDist = 0;
  for (const ci of candidates) {
    const d = distToFace(pts[ci * 3], pts[ci * 3 + 1], pts[ci * 3 + 2], face);
    if (d > EPS && d > bestDist) {
      bestDist = d;
      best = ci;
    }
  }
  return best >= 0 ? { idx: best, dist: bestDist } : null;
}

export function computeConvexHull(positions: Float32Array): ConvexHullShape {
  const n = positions.length / 3;
  if (n < 4) {
    const faces = n === 3 ? [[0, 1, 2]] : [];
    return { type: 'convex', vertices: positions, faces };
  }

  const extremeIdxs = findExtremePoints(positions);
  const tetra = buildTetrahedron(extremeIdxs, positions);
  if (!tetra) {
    const faces: number[][] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          faces.push([i, j, k]);
        }
      }
    }
    return { type: 'convex', vertices: positions, faces };
  }

  let hullFaces: TriFace[] = [
    tetFace(tetra.a, tetra.b, tetra.c, positions),
    tetFace(tetra.a, tetra.b, tetra.d, positions),
    tetFace(tetra.a, tetra.c, tetra.d, positions),
    tetFace(tetra.b, tetra.c, tetra.d, positions),
  ];

  const assigned = new Set<number>();
  for (const f of hullFaces) {
    assigned.add(f.a); assigned.add(f.b); assigned.add(f.c);
  }

  let outsideList = new Map<TriFace, number[]>();
  for (let i = 0; i < n; i++) {
    if (assigned.has(i)) continue;
    for (const f of hullFaces) {
      if (distToFace(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2], f) > EPS) {
        if (!outsideList.has(f)) outsideList.set(f, []);
        outsideList.get(f)!.push(i);
        break;
      }
    }
  }

  let iter = 0;
  while (iter < 100) {
    iter++;
    let bestFace: TriFace | null = null;
    let bestPt = -1;
    let bestDist = 0;

    for (const [face, candidates] of outsideList) {
      const r = furthestOutside(face, candidates, positions);
      if (r && r.dist > bestDist) {
        bestDist = r.dist;
        bestPt = r.idx;
        bestFace = face;
      }
    }

    if (!bestFace || bestPt < 0) break;

    const visible = findAllVisible(bestFace, bestPt, hullFaces, positions);

    const horizonEdges = findHorizon(visible, hullFaces);

    const newFaces: TriFace[] = [];
    for (const [a, b] of horizonEdges) {
      const f = buildFace(a, b, bestPt, positions);
      newFaces.push(f);
    }

    for (const f of visible) {
      const idx = hullFaces.indexOf(f);
      if (idx >= 0) {
        hullFaces.splice(idx, 1);
        outsideList.delete(f);
      }
    }

    for (const nf of newFaces) {
      const candidates: number[] = [];
      for (const [face, list] of outsideList) {
        for (const ci of list) {
          if (ci === bestPt) continue;
          if (distToFace(positions[ci * 3], positions[ci * 3 + 1], positions[ci * 3 + 2], nf) > EPS) {
            candidates.push(ci);
          }
        }
      }
      if (candidates.length > 0) {
        outsideList.set(nf, candidates);
      }
    }

    hullFaces.push(...newFaces);
  }

  const vertSet = new Set<number>();
  for (const f of hullFaces) {
    vertSet.add(f.a); vertSet.add(f.b); vertSet.add(f.c);
  }

  const verts = new Float32Array(vertSet.size * 3);
  const vertMap = new Map<number, number>();
  let vi = 0;
  for (const origIdx of vertSet) {
    vertMap.set(origIdx, vi);
    verts[vi * 3] = positions[origIdx * 3];
    verts[vi * 3 + 1] = positions[origIdx * 3 + 1];
    verts[vi * 3 + 2] = positions[origIdx * 3 + 2];
    vi++;
  }

  const faces: number[][] = [];
  for (const f of hullFaces) {
    faces.push([vertMap.get(f.a)!, vertMap.get(f.b)!, vertMap.get(f.c)!]);
  }

  return { type: 'convex', vertices: verts, faces };
}

function findExtremePoints(pts: Float32Array): number[] {
  const n = pts.length / 3;
  const extremes = [
    { i: 0, v: pts[0] },
    { i: 0, v: pts[0] },
    { i: 0, v: pts[0] },
    { i: 0, v: pts[0] },
    { i: 0, v: pts[0] },
    { i: 0, v: pts[0] },
  ];
  for (let i = 0; i < n; i++) {
    const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
    if (x < extremes[0].v) { extremes[0] = { i, v: x }; }
    if (x > extremes[1].v) { extremes[1] = { i, v: x }; }
    if (y < extremes[2].v) { extremes[2] = { i, v: y }; }
    if (y > extremes[3].v) { extremes[3] = { i, v: y }; }
    if (z < extremes[4].v) { extremes[4] = { i, v: z }; }
    if (z > extremes[5].v) { extremes[5] = { i, v: z }; }
  }
  return extremes.map(e => e.i);
}

function buildTetrahedron(extremeIdxs: number[], pts: Float32Array): { a: number; b: number; c: number; d: number } | null {
  const unique = [...new Set(extremeIdxs)];
  if (unique.length < 4) return null;

  let maxDist = -1;
  let pairA = unique[0], pairB = unique[1];
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const d = len2(
        pts[unique[i] * 3] - pts[unique[j] * 3],
        pts[unique[i] * 3 + 1] - pts[unique[j] * 3 + 1],
        pts[unique[i] * 3 + 2] - pts[unique[j] * 3 + 2],
      );
      if (d > maxDist) {
        maxDist = d;
        pairA = unique[i];
        pairB = unique[j];
      }
    }
  }

  let third = -1;
  let maxArea = 0;
  for (const i of unique) {
    if (i === pairA || i === pairB) continue;
    const ab = sub(pts[pairB * 3], pts[pairB * 3 + 1], pts[pairB * 3 + 2], pts[pairA * 3], pts[pairA * 3 + 1], pts[pairA * 3 + 2]);
    const ac = sub(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], pts[pairA * 3], pts[pairA * 3 + 1], pts[pairA * 3 + 2]);
    const cr = cross(ab.x, ab.y, ab.z, ac.x, ac.y, ac.z);
    const area = len2(cr.x, cr.y, cr.z);
    if (area > maxArea) {
      maxArea = area;
      third = i;
    }
  }
  if (third < 0) return null;

  let fourth = -1;
  let maxVol = 0;
  const fn = buildFace(pairA, pairB, third, pts);
  for (const i of unique) {
    if (i === pairA || i === pairB || i === third) continue;
    const vol = Math.abs(distToFace(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], fn));
    if (vol > maxVol) {
      maxVol = vol;
      fourth = i;
    }
  }
  if (fourth < 0) return null;

  return { a: pairA, b: pairB, c: third, d: fourth };
}

function tetFace(a: number, b: number, c: number, pts: Float32Array): TriFace {
  return buildFace(a, b, c, pts);
}

function findAllVisible(
  startFace: TriFace,
  pt: number,
  faces: TriFace[],
  pts: Float32Array,
): TriFace[] {
  const visible: TriFace[] = [];
  const visited = new Set<TriFace>();
  const stack = [startFace];

  while (stack.length > 0) {
    const f = stack.pop()!;
    if (visited.has(f)) continue;
    visited.add(f);

    const d = distToFace(pts[pt * 3], pts[pt * 3 + 1], pts[pt * 3 + 2], f);
    if (d > EPS) {
      visible.push(f);
      for (const other of faces) {
        if (other === f || visited.has(other)) continue;
        if (sharesEdge(f, other)) {
          stack.push(other);
        }
      }
    }
  }

  return visible;
}

function sharesEdge(a: TriFace, b: TriFace): boolean {
  const aEdges = [[a.a, a.b], [a.b, a.c], [a.c, a.a]];
  const bEdges = [[b.a, b.b], [b.b, b.c], [b.c, b.a]];
  for (const ae of aEdges) {
    for (const be of bEdges) {
      if ((ae[0] === be[0] && ae[1] === be[1]) || (ae[0] === be[1] && ae[1] === be[0])) {
        return true;
      }
    }
  }
  return false;
}

function findHorizon(visible: TriFace[], allFaces: TriFace[]): [number, number][] {
  const horizonEdges: [number, number][] = [];
  const visibleSet = new Set(visible);

  for (const f of visible) {
    const edges: [number, number][] = [[f.a, f.b], [f.b, f.c], [f.c, f.a]];
    for (const e of edges) {
      let isBoundary = true;
      for (const other of allFaces) {
        if (other === f || !visibleSet.has(other)) continue;
        if (sharesEdge(f, other)) {
          const oEdges: [number, number][] = [[other.a, other.b], [other.b, other.c], [other.c, other.a]];
          for (const oe of oEdges) {
            if ((e[0] === oe[0] && e[1] === oe[1]) || (e[0] === oe[1] && e[1] === oe[0])) {
              isBoundary = false;
              break;
            }
          }
        }
        if (!isBoundary) break;
      }
      if (isBoundary) {
        horizonEdges.push(e);
      }
    }
  }
  return horizonEdges;
}
