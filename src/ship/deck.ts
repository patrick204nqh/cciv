import * as THREE from 'three';
import { box, addMesh } from '../geometry';
import { M } from '../materials';

export function buildDeck(ship: THREE.Group): void {
  const DY = 6;
  addMesh(ship, box(22.5, 0.3, 60), M.deck, 0, DY, 0);
  addMesh(ship, box(21.5, 0.3, 28), M.deck, 0, DY + 1, 30);
  addMesh(ship, box(21.5, 1, 0.35), M.wdark, 0, DY + 0.5, 16.2);
  addMesh(ship, box(20, 0.3, 24), M.deck, 0, DY + 0.6, -30);
  addMesh(ship, box(20, 0.85, 0.35), M.wdark, 0, DY + 0.2, -18.1);
  for (const s of [1, -1]) {
    addMesh(ship, box(0.42, 1.85, 58), M.wdark, s * 11, DY + 0.95, 0);
    addMesh(ship, box(0.42, 2, 28), M.wdark, s * 10.6, DY + 2, 30);
    addMesh(ship, box(0.42, 1.6, 24), M.wdark, s * 9.8, DY + 1.45, -30);
  }
  for (const z of [-7, 0, 7]) {
    addMesh(ship, box(4, 0.6, 2.2), M.wdark, 0, DY + 0.4, z);
    addMesh(ship, box(3.4, 0.5, 1.7), M.glass, 0, DY + 0.85, z);
  }
  addMesh(ship, box(5, 0.7, 3.2), M.wdark, 0, DY + 1.05, -29);
  addMesh(ship, box(4.3, 0.6, 2.6), M.glass, 0, DY + 1.45, -29);
}
