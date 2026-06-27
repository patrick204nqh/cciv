import * as THREE from 'three';

export interface WaveSampler {
  sample(x: number, z: number): { height: number; dispX: number; dispZ: number };
}

export function displaceOceanGrid(
  geo: THREE.BufferGeometry,
  basePositions: Float32Array,
  waveSampler: WaveSampler,
): void {
  const pos = geo.attributes.position.array as Float32Array;
  for (let i = 0; i < pos.length / 3; i++) {
    const bx = basePositions[i * 3];
    const bz = basePositions[i * 3 + 2];
    const { height, dispX, dispZ } = waveSampler.sample(bx, bz);
    pos[i * 3] = bx + dispX;
    pos[i * 3 + 1] = height;
    pos[i * 3 + 2] = bz + dispZ;
  }
  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
}
