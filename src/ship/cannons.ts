import * as THREE from 'three';
import { box, cyl, addMesh } from '../geometry';
import { M } from '../materials';

function buildCarronade(scale: number): THREE.Group {
  const g = new THREE.Group();
  const s = scale;

  // Slide carriage — a wooden bed that the carronade recoils on
  addMesh(g, box(1.8 * s, 0.25 * s, 1.0 * s), M.wdark, 0, 0, 0);

  // Barrel body — short tapered cylinder
  const barrel = addMesh(g, cyl(0.22 * s, 0.30 * s, 1.8 * s, 10), M.brass, 0, 0.50 * s, 0);
  barrel.rotation.x = Math.PI / 2;

  // Muzzle swell — bulb at the front
  const muzzle = addMesh(g, new THREE.SphereGeometry(0.34 * s, 6, 5), M.brass, 0, 0.50 * s, 1.0 * s);
  muzzle.scale.set(1, 0.7, 0.9);

  // Cascabel — knob at the breech end
  addMesh(g, new THREE.SphereGeometry(0.16 * s, 6, 5), M.brass, 0, 0.50 * s, -1.05 * s);

  // Trunnions — pivot pins at the breech side
  const trun = (sx: number) => {
    const t = addMesh(g, cyl(0.07 * s, 0.07 * s, 0.30 * s, 6), M.brass, sx * 0.28 * s, 0.42 * s, -0.55 * s);
    t.rotation.z = Math.PI / 2;
  };
  trun(1); trun(-1);

  // Elevating screw bracket at the breech
  addMesh(g, cyl(0.06 * s, 0.06 * s, 0.35 * s, 6), M.iron, 0, 0.15 * s, -0.8 * s);

  return g;
}

export function buildCannons(ship: THREE.Group): void {
  const DY = 6;

  // HMS Beagle carried 6 brass carronades — 3 per side
  const positions: [number, number, number][] = [
    [-10.0, 0.7, 6],  [10.0, 0.7, 6],
    [-10.2, 0.7, -2], [10.2, 0.7, -2],
    [-10.6, 0.7, -7], [10.6, 0.7, -7],
  ];

  for (const [x, y, z] of positions) {
    const c = buildCarronade(x < 0 ? 0.9 : 0.9);
    c.position.set(x, DY + y, z);
    c.rotation.y = x < 0 ? 0.18 : -0.18;
    ship.add(c);
  }
}
