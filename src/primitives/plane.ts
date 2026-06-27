import * as THREE from 'three';
import type { PlaneParams } from './types';

export function buildPlane(params: PlaneParams): THREE.BufferGeometry {
  const { w, h, segW = 1, segH = 1 } = params;
  return new THREE.PlaneGeometry(w, h, segW, segH);
}
