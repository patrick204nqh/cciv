import * as THREE from 'three';
import { box, cyl, addMesh } from '../geometry';
import { M } from '../materials';

export function buildCannons(ship: THREE.Group): void {
  function cannon(x: number, z: number, scale: number, carronade = false) {
    const g = new THREE.Group();
    addMesh(g, box(1.35 * scale, 0.68 * scale, 2.1 * scale), M.wdark, 0, 0, 0);
    const bl = carronade ? 1.8 : 3.0;
    const bar = addMesh(g, cyl(0.2 * scale, 0.27 * scale, bl * scale), M.brass, 0, 0.54 * scale, 0.15 * scale);
    bar.rotation.x = Math.PI / 2;
    for (const wz of [-0.55, 0.55]) for (const wx of [-0.65, 0.65]) {
      const w = addMesh(g, cyl(0.28 * scale, 0.28 * scale, 0.14 * scale, 8), M.wdark, wx * scale, -0.22 * scale, wz * scale);
      w.rotation.z = Math.PI / 2;
    }
    g.position.set(x, 6.8, z); ship.add(g);
  }
  cannon(-10.4, 10, 0.9); cannon(10.4, 10, 0.9);
  cannon(-10.4, -2, 0.9); cannon(10.4, -2, 0.9);
  cannon(-10.8, 4, 1.1); cannon(10.8, 4, 1.1);
  cannon(0, 38, 0.78, true);
}
