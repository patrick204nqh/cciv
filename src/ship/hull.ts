import * as THREE from 'three';
import { M } from '../materials';

export function buildHull(ship: THREE.Group): void {
  const L = 90, HB = 12, DR = 9, FB = 6;
  const plan = [0.80, 0.89, 0.96, 1.0, 0.995, 0.97, 0.92, 0.83, 0.58, 0.22, 0.04];
  const body = [0, 0.22, 0.56, 0.84, 1.0, 0.99, 0.97, 0.955];

  function lerp1(arr: number[], t: number) {
    const n = arr.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i;
    return arr[i] * (1 - f) + arr[i + 1] * f;
  }

  function hp(u: number, v: number): [number, number, number] {
    return [HB * lerp1(plan, u) * lerp1(body, v), -DR + v * (DR + FB), (u - 0.5) * L];
  }

  const wV = DR / (DR + FB);
  const US = 40, VS = 14;

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

  const kPts: number[] = [];
  for (let i = 0; i <= US; i++) { const [b, y, z] = hp(i / US, 0); kPts.push(-b * 0.35, y - 0.25, z, b * 0.35, y - 0.25, z); }
  const kIdx: number[] = []; for (let i = 0; i < US; i++) { const a = i * 2; kIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const kg = new THREE.BufferGeometry();
  kg.setAttribute('position', new THREE.Float32BufferAttribute(kPts, 3));
  kg.setIndex(kIdx); kg.computeVertexNormals();
  ship.add(new THREE.Mesh(kg, M.copper));

  const [tb] = hp(0, 1); const [, , tZ] = hp(0, 0);
  const trPts = [-tb, -DR, tZ, tb, -DR, tZ, tb, FB, tZ, -tb, FB, tZ];
  const trG = new THREE.BufferGeometry();
  trG.setAttribute('position', new THREE.Float32BufferAttribute(trPts, 3));
  trG.setIndex([0, 1, 2, 0, 2, 3]); trG.computeVertexNormals();
  ship.add(new THREE.Mesh(trG, M.hull));

  const gsV0 = (DR + 2.5) / (DR + FB), gsV1 = (DR + 3.4) / (DR + FB);
  for (const s of [1, -1]) buildSide(s, gsV0, gsV1, 2, M.gun);
}
