import * as THREE from 'three';
import { M } from '../materials';

function sailGrid(w: number, h: number, belly: number, sag: number, segU = 14, segV = 10): THREE.BufferGeometry {
  const pts: number[] = [];
  const idx: number[] = [];
  const uvs: number[] = [];

  for (let j = 0; j <= segV; j++) {
    const v = j / segV;
    for (let i = 0; i <= segU; i++) {
      const u = i / segU;
      const up = (u - 0.5) * 2;

      const leechIn = 1 - 0.06 * (1 + v * 0.6);
      const x = (u - 0.5) * w * leechIn;

      const bellyProfile = Math.sin(u * Math.PI);
      const buntSag = sag * v * bellyProfile;
      const cornerLift = (1 - bellyProfile) * h * 0.03 * v;
      const y = -v * h + buntSag + cornerLift;

      const billowZ = belly * Math.sin(u * Math.PI) * Math.sin(v * Math.PI);

      pts.push(x, y, billowZ);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < segV; j++) {
    for (let i = 0; i < segU; i++) {
      const a = j * (segU + 1) + i;
      const b = a + 1;
      const c = (j + 1) * (segU + 1) + i;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function triSailGrid(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, belly: number, seg = 8): THREE.BufferGeometry {
  const pts: number[] = [];
  const idx: number[] = [];
  const uvs: number[] = [];

  const e1 = new THREE.Vector3().copy(p2).sub(p1);
  const e2 = new THREE.Vector3().copy(p3).sub(p1);
  const normal = new THREE.Vector3().crossVectors(e1, e2).normalize();

  for (let j = 0; j <= seg; j++) {
    const v = j / seg;
    for (let i = 0; i <= seg - j; i++) {
      const u = i / seg;
      const px = p1.x + e1.x * u + e2.x * v;
      const py = p1.y + e1.y * u + e2.y * v;
      const pz = p1.z + e1.z * u + e2.z * v;

      const bellyU = Math.sin(u * Math.PI);
      const bellyV = Math.sin(v * Math.PI);
      const billow = belly * bellyU * bellyV * (1 - u - v > 0 ? 1 : 0);

      pts.push(px + normal.x * billow, py + normal.y * billow, pz + normal.z * billow);
      uvs.push(u, v);
    }
  }

  const vertsPerRow: number[] = [];
  for (let j = 0; j <= seg; j++) vertsPerRow.push(seg - j + 1);

  let base = 0;
  for (let j = 0; j < seg; j++) {
    const rowLen = vertsPerRow[j];
    const nextRowLen = vertsPerRow[j + 1];
    for (let i = 0; i < rowLen - 1; i++) {
      const a = base + i;
      const b = a + 1;
      const c = base + rowLen + i;
      const d = c + 1;
      if (i < nextRowLen - 1) {
        idx.push(a, c, b, b, c, d);
      } else {
        idx.push(a, c, b);
      }
    }
    base += rowLen;
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function buildSails(ship: THREE.Group): void {
  const DY = 6;

  function sqSail(z: number, cy: number, w: number, h: number, belly: number) {
    const sag = belly * 0.3;
    const g = sailGrid(w, h, belly, sag);
    const m = new THREE.Mesh(g, M.sail);
    m.position.set(0, cy, z + belly * 0.5);
    m.castShadow = true;
    ship.add(m);
  }

  sqSail(21, DY + 8, 50, 24, 1.4);
  sqSail(21, DY + 30, 39, 20, 1.0);
  sqSail(21, DY + 48, 27, 13, 0.65);
  sqSail(21, DY + 58, 17, 7, 0.35);

  sqSail(3, DY + 9, 60, 28, 1.6);
  sqSail(3, DY + 35, 47, 22, 1.1);
  sqSail(3, DY + 58, 32, 14, 0.7);
  sqSail(3, DY + 70, 21, 8, 0.4);

  sqSail(-22, DY + 33, 21, 11, 0.4);

  // Spanker — gaff sail, quadrilateral
  const sp = sailGrid(14, 34, 0.6, 0.18);
  const spMesh = new THREE.Mesh(sp, M.sail);
  spMesh.position.set(0, DY + 12, -36);
  spMesh.rotation.x = -0.32;
  spMesh.castShadow = true;
  ship.add(spMesh);

  // Triangular headsails (jibs and staysails)
  function triSail(p1: [number, number, number], p2: [number, number, number], p3: [number, number, number], belly: number) {
    const g = triSailGrid(new THREE.Vector3(...p1), new THREE.Vector3(...p2), new THREE.Vector3(...p3), belly);
    const m = new THREE.Mesh(g, M.sail);
    m.castShadow = true;
    ship.add(m);
  }

  triSail([0, DY + 11, 44], [0, DY + 67, 18], [0, DY + 11, 68], 0.8);
  triSail([0, DY + 12, 60], [0, DY + 52, 19], [0, DY + 12, 76], 0.5);

  // Staysails between masts
  function quadSail(p1: [number, number, number], p2: [number, number, number], p3: [number, number, number], p4: [number, number, number], belly: number) {
    const midPts = 10;
    const allPts: number[] = [];
    const allIdx: number[] = [];
    const allUvs: number[] = [];
    const p1v = new THREE.Vector3(...p1), p2v = new THREE.Vector3(...p2);
    const p3v = new THREE.Vector3(...p3), p4v = new THREE.Vector3(...p4);

    for (let j = 0; j <= midPts; j++) {
      const v = j / midPts;
      const left = new THREE.Vector3().lerpVectors(p1v, p4v, v);
      const right = new THREE.Vector3().lerpVectors(p2v, p3v, v);
      const edge = new THREE.Vector3().copy(right).sub(left);
      const normal = new THREE.Vector3().crossVectors(edge, new THREE.Vector3(0, 0, 1)).normalize();

      for (let i = 0; i <= midPts; i++) {
        const u = i / midPts;
        const p = new THREE.Vector3().lerpVectors(left, right, u);
        const billow = belly * Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
        allPts.push(p.x + normal.x * billow, p.y + normal.y * billow, p.z + normal.z * billow);
        allUvs.push(u, v);
      }
    }

    for (let j = 0; j < midPts; j++) {
      for (let i = 0; i < midPts; i++) {
        const a = j * (midPts + 1) + i;
        const b = a + 1;
        const c = (j + 1) * (midPts + 1) + i;
        const d = c + 1;
        allIdx.push(a, c, b, b, c, d);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(allPts, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(allUvs, 2));
    g.setIndex(allIdx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, M.sail);
    m.castShadow = true;
    ship.add(m);
  }

  quadSail([0, DY + 10, 21], [0, DY + 67, 18], [0, DY + 78, 0], [0, DY + 10, 3], 0.6);
  quadSail([0, DY + 10, 3], [0, DY + 78, 0], [0, DY + 52, -24], [0, DY + 10, -22], 0.6);
}
