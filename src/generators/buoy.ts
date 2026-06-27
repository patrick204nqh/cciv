import * as THREE from 'three';

export interface BuoyParams {
  height: number;
  radius: number;
  poleHeight: number;
}

function mergeBufferGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geos.length === 0) return null;
  const merged = new THREE.BufferGeometry();
  const pos: number[] = [];
  const idx: number[] = [];
  let offset = 0;
  for (const g of geos) {
    const p = g.attributes.position.array as Float32Array;
    for (let i = 0; i < p.length; i++) pos.push(p[i]);
    if (g.index) {
      const ind = g.index.array;
      for (let i = 0; i < ind.length; i++) idx.push(ind[i] + offset / 3);
    }
    offset += p.length;
  }
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  merged.setIndex(idx);
  merged.computeVertexNormals();
  return merged;
}

export function generateBuoy(params: BuoyParams): THREE.BufferGeometry {
  const { height, radius, poleHeight } = params;

  const body = new THREE.SphereGeometry(radius, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  body.translate(0, radius * 0.5, 0);

  const pole = new THREE.CylinderGeometry(0.05, 0.05, poleHeight, 6);
  pole.translate(0, radius + poleHeight / 2, 0);

  const merged = mergeBufferGeometries([body, pole]);
  if (!merged) throw new Error('Failed to merge buoy geometry');
  return merged;
}
