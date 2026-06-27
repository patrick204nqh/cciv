import * as THREE from 'three';
import type { SphereParams } from './types';

export function buildSphere(params: SphereParams): THREE.BufferGeometry {
  const { radius, widthSegments = 16, heightSegments = 12 } = params;
  return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
}
