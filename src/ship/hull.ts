import * as THREE from 'three';
import { M } from '../materials';

const L = 90, HB = 12, DR = 9, FB = 6;

const plan = [0.75, 0.84, 0.93, 0.97, 0.99, 1.0, 0.99, 0.90, 0.66, 0.30, 0.06];
const body = [0, 0.15, 0.45, 0.72, 0.88, 0.98, 1.0, 0.82];

export function sheerAt(u: number): number {
  return 7.878 * u * u - 8.878 * u + 2.5;
}

function lerp1(arr: number[], t: number) {
  const n = arr.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i;
  return arr[i] * (1 - f) + arr[i + 1] * f;
}

function hp(u: number, v: number): [number, number, number] {
  return [HB * lerp1(plan, u) * lerp1(body, v), -DR + v * (DR + FB + sheerAt(u)), (u - 0.5) * L];
}

export function buildHull(ship: THREE.Group): void {

  const wV = DR / (DR + FB);
  const US = 44, VS = 14;

  function buildSide(side: number, v0: number, v1: number, vseg: number, mat: THREE.Material) {
    const pts: number[] = [], idx: number[] = [], uvs: number[] = [];
    for (let i = 0; i <= US; i++) for (let j = 0; j <= vseg; j++) {
      const v = v0 + (j / vseg) * (v1 - v0);
      const [b, y, z] = hp(i / US, v);
      pts.push(side * b, y, z); uvs.push(i / US, j / vseg);
    }
    for (let i = 0; i < US; i++) for (let j = 0; j < vseg; j++) {
      const a = i * (vseg + 1) + j, b = a + 1, c = (i + 1) * (vseg + 1) + j, d = c + 1;
      side > 0 ? idx.push(a, c, b, b, c, d) : idx.push(a, b, c, b, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.castShadow = true; ship.add(m);
  }

  for (const s of [1, -1]) {
    buildSide(s, 0, wV, 9, M.copper);
    buildSide(s, wV, 1, 5, M.hull);
  }

  // Keel — extends below the hull along the centerline
  const kPts: number[] = [];
  for (let i = 0; i <= US; i++) {
    const [b, y, z] = hp(i / US, 0);
    const kOff = 0.30;
    kPts.push(-kOff, y - 0.4, z, kOff, y - 0.4, z);
  }
  const kIdx: number[] = [];
  for (let i = 0; i < US; i++) { const a = i * 2; kIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const kg = new THREE.BufferGeometry();
  kg.setAttribute('position', new THREE.Float32BufferAttribute(kPts, 3));
  kg.setIndex(kIdx); kg.computeVertexNormals();
  ship.add(new THREE.Mesh(kg, M.copper));

  // Keel vertical fin — thin strip projecting below keel
  const kfPts: number[] = [];
  for (let i = 0; i <= US; i++) {
    const [, y, z] = hp(i / US, 0);
    kfPts.push(0, y - 0.4, z, 0, y - 0.8, z);
  }
  const kfIdx: number[] = [];
  for (let i = 0; i < US; i++) { const a = i * 2; kfIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const kfg = new THREE.BufferGeometry();
  kfg.setAttribute('position', new THREE.Float32BufferAttribute(kfPts, 3));
  kfg.setIndex(kfIdx); kfg.computeVertexNormals();
  ship.add(new THREE.Mesh(kfg, M.hull));

  // Transom — flat stern face
  const [tb, ty] = hp(0, 1); const [, , tZ] = hp(0, 0);
  const trPts = [-tb, -DR, tZ, tb, -DR, tZ, tb * 0.88, ty, tZ, -tb * 0.88, ty, tZ];
  const trG = new THREE.BufferGeometry();
  trG.setAttribute('position', new THREE.Float32BufferAttribute(trPts, 3));
  trG.setIndex([0, 1, 2, 0, 2, 3]); trG.computeVertexNormals();
  ship.add(new THREE.Mesh(trG, M.hull));

  // Stem — curved bow piece forward of the hull
  const [, y0, z0] = hp(1, 0);
  const [b1, y1, z1] = hp(1, 1);
  const stemSeg = 10;
  const stemPts: number[] = [];
  for (let i = 0; i <= stemSeg; i++) {
    const t = i / stemSeg;
    const sx = b1 * (1 - t) * 0.12;
    const sy = y0 + (y1 - y0) * t;
    const sz = z1 + (z1 - z0) * t * 0.12;
    const sideW = 0.08 * (1 - t * 0.5);
    stemPts.push(-sideW, sy, sz, sideW, sy, sz);
  }
  const stemIdx: number[] = [];
  for (let i = 0; i < stemSeg; i++) { const a = i * 2; stemIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const stemG = new THREE.BufferGeometry();
  stemG.setAttribute('position', new THREE.Float32BufferAttribute(stemPts, 3));
  stemG.setIndex(stemIdx); stemG.computeVertexNormals();
  ship.add(new THREE.Mesh(stemG, M.hull));

  // Rudder — flat piece at the stern
  const rPts: number[] = [];
  const [, rYk, rZk] = hp(0, 0);
  const [, rYd, rZd] = hp(0.03, 1);
  const rSeg = 8;
  for (let i = 0; i <= rSeg; i++) {
    const t = i / rSeg;
    const ry = rYk + (rYd - rYk) * t;
    const rz = rZk - 2 - t * 3.5;
    const rw = 0.08 + t * 0.6;
    rPts.push(-rw, ry, rz, rw, ry, rz);
  }
  const rIdx: number[] = [];
  for (let i = 0; i < rSeg; i++) { const a = i * 2; rIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const rG = new THREE.BufferGeometry();
  rG.setAttribute('position', new THREE.Float32BufferAttribute(rPts, 3));
  rG.setIndex(rIdx); rG.computeVertexNormals();
  ship.add(new THREE.Mesh(rG, M.wdark));

  // Gun stripe
  const gsV0 = (DR + 2.5) / (DR + FB), gsV1 = (DR + 3.4) / (DR + FB);
  for (const s of [1, -1]) buildSide(s, gsV0, gsV1, 2, M.gun);
}
