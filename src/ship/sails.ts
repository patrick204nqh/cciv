import * as THREE from 'three';
import { M } from '../materials';

export function buildSails(ship: THREE.Group): void {
  const DY = 6;

  function sqSail(z: number, cy: number, w: number, h: number, belly = 1) {
    const sh = new THREE.Shape();
    const hw = w / 2, hh = h / 2;
    sh.moveTo(-hw, -hh); sh.quadraticCurveTo(0, -hh + belly, hw, -hh);
    sh.lineTo(hw, hh); sh.quadraticCurveTo(0, hh - belly * 0.4, -hw, hh); sh.closePath();
    const g = new THREE.ShapeGeometry(sh, 10);
    const m = new THREE.Mesh(g, M.sail);
    m.position.set(0, cy, z + belly * 0.9); m.castShadow = true; ship.add(m);
  }

  sqSail(21, DY + 7, 50, 22, 1.40);
  sqSail(21, DY + 25, 39, 18, 1.00);
  sqSail(21, DY + 40, 27, 12, 0.65);
  sqSail(21, DY + 53, 17, 8, 0.38);

  sqSail(3, DY + 8, 60, 24, 1.60);
  sqSail(3, DY + 30, 47, 20, 1.10);
  sqSail(3, DY + 50, 32, 14, 0.70);
  sqSail(3, DY + 63, 21, 10, 0.45);

  sqSail(-22, DY + 29, 21, 10, 0.45);

  const sp = new THREE.BufferGeometry();
  sp.setAttribute('position', new THREE.Float32BufferAttribute([
    0, DY + 8, -22, 0, DY + 43, -22, 0, DY + 39, -34, 0, DY + 8, -50
  ], 3)); sp.setIndex([0, 2, 1, 0, 3, 2]); sp.computeVertexNormals();
  ship.add(new THREE.Mesh(sp, M.sail));

  function triSail(p1: [number, number, number], p2: [number, number, number], p3: [number, number, number]) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([...p1, ...p2, ...p3], 3));
    g.setIndex([0, 2, 1]); g.computeVertexNormals();
    ship.add(new THREE.Mesh(g, M.sail));
  }
  triSail([0, DY + 9, 44], [0, DY + 60, 18], [0, DY + 9, 68]);
  triSail([0, DY + 10, 60], [0, DY + 47, 19], [0, DY + 10, 76]);

  const stg = new THREE.BufferGeometry();
  stg.setAttribute('position', new THREE.Float32BufferAttribute([
    0, DY + 8, 21, 0, DY + 60, 18, 0, DY + 69, 0, 0, DY + 8, 3
  ], 3));
  stg.setIndex([0, 1, 2, 0, 2, 3]); stg.computeVertexNormals();
  ship.add(new THREE.Mesh(stg, M.sail));

  const smz = new THREE.BufferGeometry();
  smz.setAttribute('position', new THREE.Float32BufferAttribute([
    0, DY + 8, 3, 0, DY + 69, 0, 0, DY + 47, -24, 0, DY + 8, -22
  ], 3));
  smz.setIndex([0, 1, 2, 0, 2, 3]); smz.computeVertexNormals();
  ship.add(new THREE.Mesh(smz, M.sail));
}
