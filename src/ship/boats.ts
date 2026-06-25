import * as THREE from 'three';
import { box, cyl, addMesh, line } from '../geometry';
import { M } from '../materials';

export function buildBoats(ship: THREE.Group): void {
  const DY = 6;

  function miniHull(bL: number, bB: number, bD: number) {
    const g = new THREE.Group();
    const sg = 12; const pts: number[] = [];
    for (let i = 0; i <= sg; i++) {
      const u = i / sg, z = (u - 0.5) * bL;
      const bf = Math.sin(u * Math.PI) * 0.84 + 0.16, hb = (bB / 2) * bf;
      const yb = -bD + Math.sin(u * Math.PI) * bD * 0.38;
      pts.push(-hb, yb, z, hb, yb, z, -hb, 0, z, hb, 0, z);
    }
    const idx: number[] = [];
    for (let i = 0; i < sg; i++) { const b = i * 4;
      idx.push(b, b + 4, b + 1, b + 1, b + 4, b + 5);
      idx.push(b, b + 2, b + 4, b + 2, b + 6, b + 4);
      idx.push(b + 1, b + 5, b + 3, b + 3, b + 5, b + 7);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, M.wlight));
    for (let t = 1; t < 4; t++) {
      addMesh(g, box(bB * 0.7, 0.14, 0.36), M.wdark, 0, -0.08, (t / 4 - 0.5) * bL);
    }
    return g;
  }

  const b_outer = miniHull(17, 5.0, 1.9);
  b_outer.position.set(1.2, DY + 0.45, 5); b_outer.rotation.y = 0.14; ship.add(b_outer);
  const b_inner = miniHull(14, 3.8, 1.55);
  b_inner.position.set(-1.0, DY + 0.45 + 1.7, 4); b_inner.rotation.y = -0.10; ship.add(b_inner);

  for (const [bz, bx] of [[-26, 3.5], [-33, -3.5]]) {
    const skidBoat = miniHull(14, 3.8, 1.5);
    skidBoat.position.set(bx, DY + 0.9, bz); ship.add(skidBoat);
    for (const oz of [-3, 3]) addMesh(ship, box(5.5, 0.45, 0.45), M.wdark, bx, DY + 0.5, bz + oz);
  }

  function quarterDavit(side: number, bz: number) {
    const bx = side * 14.8;
    addMesh(ship, cyl(0.13, 0.13, 5.5), M.wdark, side * 9.5, DY + 2.5, bz);
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(side * 9.5, DY + 7.8, bz),
      new THREE.Vector3(side * 12.8, DY + 10.5, bz),
      new THREE.Vector3(bx, DY + 11.8, bz));
    ship.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(8)), M.rl));
    for (const dz of [-3.5, 3.5]) {
      line([[bx, DY + 11.5, bz + dz], [bx, DY + 9.0, bz + dz]], M.rl, ship);
    }
    const bt = miniHull(10.5, 3.1, 1.3);
    bt.position.set(bx, DY + 8.8, bz);
    bt.rotation.z = side > 0 ? 0.20 : -0.20;
    ship.add(bt);
  }
  quarterDavit(1, -18); quarterDavit(-1, -18);

  const dinghy = miniHull(7.5, 2.7, 1.1);
  dinghy.position.set(0, DY + 7.8, -47.5); ship.add(dinghy);
  for (const s of [-1, 1]) line([[s * 3.5, DY + 6.5, -44], [s * 1.2, DY + 8.5, -47]], M.rl, ship);
}
