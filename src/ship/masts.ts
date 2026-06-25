import * as THREE from 'three';
import { cyl, addMesh } from '../geometry';
import { M } from '../materials';

export function buildMasts(ship: THREE.Group): void {
  const DY = 6;
  const RAKE = -0.056;

  function mkMastGrp(mZ: number, sections: [number, number, number][]) {
    const g = new THREE.Group();
    g.position.set(0, DY, mZ);
    g.rotation.x = RAKE;
    ship.add(g);
    let y = 0;
    sections.forEach(([r1, r2, h]) => {
      addMesh(g, cyl(r1, r2, h), M.mast, 0, y + h / 2, 0); y += h;
    });
    addMesh(g, new THREE.SphereGeometry(0.52, 6, 4), M.wdark, 0, y + 0.4, 0);
    return { g, top: y };
  }

  function addYard(g: THREE.Group, y: number, len: number, r1 = 0.09, r2 = 0.17) {
    addMesh(g, cyl(r1, r2, len), M.mast, 0, y, 0, 0, 0, Math.PI / 2);
  }

  const { g: fg } = mkMastGrp(21, [
    [0.30, 0.50, 32], [0.16, 0.25, 15], [0.09, 0.14, 9], [0.05, 0.09, 4],
  ]);
  addYard(fg, 18, 50, 0.11, 0.22);
  addYard(fg, 34, 39, 0.09, 0.17);
  addYard(fg, 46, 27, 0.07, 0.12);
  addYard(fg, 55, 17, 0.04, 0.08);

  const { g: mg } = mkMastGrp(3, [
    [0.34, 0.56, 36], [0.19, 0.30, 18], [0.10, 0.17, 10], [0.06, 0.10, 5],
  ]);
  addYard(mg, 20, 60, 0.13, 0.25);
  addYard(mg, 40, 47, 0.10, 0.20);
  addYard(mg, 57, 32, 0.07, 0.14);
  addYard(mg, 67, 21, 0.04, 0.09);

  const { g: zg } = mkMastGrp(-22, [
    [0.23, 0.38, 28], [0.13, 0.20, 13],
  ]);
  addYard(zg, 34, 21, 0.07, 0.12);

  const gaff = addMesh(ship, cyl(0.08, 0.16, 22), M.mast, 0, DY + 29, -22);
  gaff.rotation.x = 0.38; gaff.position.z = -27;

  const boom = addMesh(ship, cyl(0.08, 0.17, 28), M.mast, 0, DY + 8, -22);
  boom.rotation.x = 0.07; boom.position.z = -32;

  const bsLen = 30;
  const bs = addMesh(ship, cyl(0.12, 0.40, bsLen), M.mast, 0, DY + 9, 45 + bsLen * 0.35);
  bs.rotation.x = -0.40;

  const jbLen = 17;
  const jb = addMesh(ship, cyl(0.06, 0.10, jbLen), M.mast, 0, DY + 14, 62 + jbLen * 0.34);
  jb.rotation.x = -0.30;
}
