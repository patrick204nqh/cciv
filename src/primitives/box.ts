import * as THREE from 'three';
import type { BoxParams } from './types';

export function buildBox(params: BoxParams): THREE.BufferGeometry {
  const { w, h, d, segW = 1, segH = 1, segD = 1 } = params;
  return new THREE.BoxGeometry(w, h, d, segW, segH, segD);
}
