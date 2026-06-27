import * as THREE from 'three';
import type { LatheParams } from './types';

export function buildLathe(params: LatheParams): THREE.BufferGeometry {
  const { points, segments = 16 } = params;
  const vec2points = points.map(p => new THREE.Vector2(p.x, p.y));
  return new THREE.LatheGeometry(vec2points, segments);
}
