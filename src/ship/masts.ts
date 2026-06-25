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
    [0.30, 0.50, 35], [0.16, 0.25, 17], [0.09, 0.14, 10], [0.05, 0.09, 5],
  ]);
  addYard(fg, 22, 50, 0.11, 0.22);
  addYard(fg, 40, 39, 0.09, 0.17);
  addYard(fg, 54, 27, 0.07, 0.12);
  addYard(fg, 63, 17, 0.04, 0.08);

  const { g: mg } = mkMastGrp(3, [
    [0.34, 0.56, 42], [0.19, 0.30, 20], [0.10, 0.17, 12], [0.06, 0.10, 6],
  ]);
  addYard(mg, 26, 60, 0.13, 0.25);
  addYard(mg, 48, 47, 0.10, 0.20);
  addYard(mg, 65, 32, 0.07, 0.14);
  addYard(mg, 75, 21, 0.04, 0.09);

  const { g: zg } = mkMastGrp(-22, [
    [0.23, 0.38, 32], [0.13, 0.20, 15],
  ]);
  addYard(zg, 38, 21, 0.07, 0.12);

  const gaff = addMesh(ship, cyl(0.08, 0.16, 22), M.mast, 0, DY + 34, -22);
  gaff.rotation.x = 0.38; gaff.position.z = -27;

  const boom = addMesh(ship, cyl(0.08, 0.17, 28), M.mast, 0, DY + 10, -22);
  boom.rotation.x = 0.07; boom.position.z = -32;

  const bsLen = 30;
  const bs = addMesh(ship, cyl(0.12, 0.40, bsLen), M.mast, 0, DY + 11, 45 + bsLen * 0.35);
  bs.rotation.x = -0.40;

  const jbLen = 17;
  const jb = addMesh(ship, cyl(0.06, 0.10, jbLen), M.mast, 0, DY + 17, 62 + jbLen * 0.34);
  jb.rotation.x = -0.30;
}
