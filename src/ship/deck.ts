import * as THREE from 'three';
import { box, addMesh } from '../geometry';
import { M } from '../materials';
import { sheerAt } from './hull';

function deckSheerFn(v: number, stern: number, bow: number): number {
  const a = 2 * stern + 2 * bow;
  const b = -3 * stern - bow;
  const c = stern;
  return a * v * v + b * v + c;
}

function curvedDeck(w: number, l: number, camber: number, yBase: number, sheerStern: number, sheerBow: number, segW = 16, segL = 24): THREE.BufferGeometry {
  const pts: number[] = [];
  const idx: number[] = [];
  const uvs: number[] = [];

  for (let j = 0; j <= segL; j++) {
    const v = j / segL;
    const z = (v - 0.5) * l;
    const sheerRise = deckSheerFn(v, sheerStern, sheerBow);

    for (let i = 0; i <= segW; i++) {
      const u = i / segW;
      const x = (u - 0.5) * w;
      const camberRise = camber * (1 - (u - 0.5) ** 2 * 4);

      pts.push(x, yBase + camberRise + sheerRise, z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < segL; j++) {
    for (let i = 0; i < segW; i++) {
      const a = j * (segW + 1) + i;
      const b = a + 1;
      const c = (j + 1) * (segW + 1) + i;
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

function addCurvedDeck(ship: THREE.Group, w: number, l: number, yBase: number, camber: number, sheerStern: number, sheerBow: number): void {
  const g = curvedDeck(w, l, camber, yBase, sheerStern, sheerBow);
  const m = new THREE.Mesh(g, M.deck);
  m.receiveShadow = true;
  m.position.set(0, 0, 0);
  ship.add(m);
}

export function buildDeck(ship: THREE.Group): void {
  const DY = 6;
  const camber = 0.45;

  // Main deck spans 60/90 of hull: u=0.167 to u=0.833
  const sMain = sheerAt(0.167), bMain = sheerAt(0.833);
  addCurvedDeck(ship, 22.5, 60, DY, camber, sMain, bMain);

  // Forecastle deck
  const sFore = sheerAt(0.70), bFore = sheerAt(0.98);
  addCurvedDeck(ship, 21.5, 28, DY + 1, camber * 0.9, sFore, bFore);

  // Quarterdeck
  const sQd = sheerAt(0.03), bQd = sheerAt(0.30);
  addCurvedDeck(ship, 20, 24, DY + 0.6, camber * 0.85, sQd, bQd);

  // Deck edge beams (sheer shelf)
  addMesh(ship, box(21.5, 0.8, 0.35), M.wdark, 0, DY + 0.4, 16.2);
  addMesh(ship, box(20, 0.7, 0.35), M.wdark, 0, DY + 0.2, -18.1);

  // Bulwarks — follow the deck sheer line
  for (const s of [1, -1]) {
    addMesh(ship, box(0.42, 1.85, 58), M.wdark, s * 11, DY + 0.95, 0);
    addMesh(ship, box(0.42, 2, 28), M.wdark, s * 10.6, DY + 2, 30);
    addMesh(ship, box(0.42, 1.6, 24), M.wdark, s * 9.8, DY + 1.45, -30);
  }

  // Skylights
  for (const z of [-7, 0, 7]) {
    addMesh(ship, box(4, 0.6, 2.2), M.wdark, 0, DY + 0.4, z);
    addMesh(ship, box(3.4, 0.5, 1.7), M.glass, 0, DY + 0.85, z);
  }

  // Stern cabin window
  addMesh(ship, box(5, 0.7, 3.2), M.wdark, 0, DY + 1.05, -29);
  addMesh(ship, box(4.3, 0.6, 2.6), M.glass, 0, DY + 1.45, -29);
}
