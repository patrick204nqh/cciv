import * as THREE from 'three';
import { box, cyl, addMesh } from '../geometry';
import { M } from '../materials';

export function buildDeckDetails(ship: THREE.Group): void {
  const DY = 6;
  const WX = 25;
  addMesh(ship, box(6.5, 1.2, 3.0), M.wdark, 0, DY + 0.65, WX);
  const wl = addMesh(ship, cyl(0.75, 0.75, 6.4, 8), M.wlight, 0, DY + 1.42, WX); wl.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) addMesh(ship, box(0.30, 1.5, 0.40), M.iron, s * 3.4, DY + 0.75, WX);
  for (const s of [-1, 1]) addMesh(ship, box(0.5, 2.8, 0.5), M.wdark, s * 3.4, DY + 1.4, WX + 1.2);
  addMesh(ship, box(7.5, 0.4, 0.4), M.wdark, 0, DY + 2.9, WX + 1.2);

  addMesh(ship, cyl(0.22, 0.26, 3.2), M.iron, -3, DY + 1.1, 27);
  addMesh(ship, cyl(0.30, 0.22, 0.3, 6), M.iron, -3, DY + 2.8, 27);

  const WZ = -36;
  addMesh(ship, new THREE.TorusGeometry(2, 0.1, 4, 20), M.wdark, 0, DY + 3.2, WZ).rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const sp = addMesh(ship, cyl(0.055, 0.055, 4, 4), M.wlight, 0, DY + 3.2, WZ);
    sp.rotation.set(Math.PI / 2, 0, a);
  }
  addMesh(ship, cyl(0.48, 0.48, 0.28, 8), M.wdark, 0, DY + 3.2, WZ).rotation.x = Math.PI / 2;

  addMesh(ship, cyl(0.48, 0.52, 1.9, 6), M.wdark, 0, DY + 1.15, WZ + 3.2);
  const bt = addMesh(ship, new THREE.SphereGeometry(0.5, 6, 4, 0, Math.PI), M.brass, 0, DY + 2.2, WZ + 3.2);
  bt.rotation.x = Math.PI;

  addMesh(ship, cyl(0.78, 1.0, 1.15, 8), M.wdark, 0, DY + 0.7, 26);
  addMesh(ship, cyl(1.0, 0.65, 0.48, 8), M.wlight, 0, DY + 1.45, 26);
  for (let b = 0; b < 4; b++) {
    const a = b * Math.PI / 2;
    const bar = addMesh(ship, cyl(0.07, 0.07, 3.5, 4), M.wlight, Math.cos(a) * 0.7, DY + 1.55, 26 + Math.sin(a) * 0.7);
    bar.rotation.set(Math.PI / 2, 0, a + Math.PI / 2);
  }

  for (const s of [-1, 1]) {
    const ast = addMesh(ship, cyl(0.2, 0.25, 4.5, 6), M.iron, s * 8, DY + 0.5, 38); ast.rotation.z = 0.28 * s;
    addMesh(ship, box(3.6, 0.28, 0.28), M.iron, s * 8, DY + 0.05, 36.5);
  }

  const bellPts: THREE.Vector2[] = [
    new THREE.Vector2(0, 0), new THREE.Vector2(0.32, 0.1),
    new THREE.Vector2(0.48, 0.5), new THREE.Vector2(0.42, 1),
  ];
  addMesh(ship, new THREE.LatheGeometry(bellPts, 8), M.brass, 0, DY + 3.65, 36).scale.set(0.65, 0.65, 0.65);

  for (const hz of [13, 0, -12]) {
    addMesh(ship, box(5, 0.58, 4), M.wdark, 0, DY + 0.02, hz);
    addMesh(ship, box(4.5, 0.5, 3.6), M.wlight, 0, DY + 0.3, hz);
  }

  addMesh(ship, box(2.8, 1.9, 2.1), M.wdark, 0, DY + 1.95, 17.5);
  addMesh(ship, box(2.4, 1.6, 1.7), M.glass, 0, DY + 2.0, 17.5);
  addMesh(ship, box(2.6, 1.6, 1.9), M.wdark, 3.5, DY + 1.65, -19);
  addMesh(ship, box(2.2, 1.4, 1.5), M.glass, 3.5, DY + 1.7, -19);

  for (const s of [-1, 1]) {
    addMesh(ship, box(0.45, 2.2, 0.45), M.wdark, s * 4.5, DY + 1.1, 35);
  }
  addMesh(ship, box(10, 0.4, 0.4), M.wdark, 0, DY + 2.2, 35);

  for (const z of [38, 28, 18, 8, -4, -14, -24, -34]) {
    for (const s of [-1, 1]) {
      addMesh(ship, box(0.3, 0.5, 0.9), M.iron, s * 9.5, DY + 0.2, z);
    }
  }
}
