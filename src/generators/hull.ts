import * as THREE from 'three';

export interface HullParams {
  length: number;
  beam: number;
  depth: number;
  bowCurve: number;
}

export function generateHull(params: HullParams): THREE.BufferGeometry {
  const { length, beam, depth, bowCurve } = params;
  const segments = 12;
  const verts: number[] = [];
  const idx: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const xScale = beam / 2 * (1 - t * (1 - bowCurve * 0.7));
    const yScale = depth * (1 - t * 0.2);
    const zPos = -length / 2 + t * length;

    verts.push(0, -yScale, zPos);
    verts.push(-xScale, 0, zPos);
    verts.push(xScale, 0, zPos);

    if (i > 0) {
      const a = (i - 1) * 3, b = i * 3;
      idx.push(a, b, a + 1);
      idx.push(a + 1, b, b + 1);
      idx.push(a, a + 2, b);
      idx.push(a + 2, b + 2, b);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
