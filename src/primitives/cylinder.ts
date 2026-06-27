import * as THREE from 'three';
import type { CylinderParams } from './types';

export function buildCylinder(params: CylinderParams): THREE.BufferGeometry {
  const { rTop, rBot, height, radialSegments = 16, heightSegments = 1 } = params;
  return new THREE.CylinderGeometry(rTop, rBot, height, radialSegments, heightSegments);
}
