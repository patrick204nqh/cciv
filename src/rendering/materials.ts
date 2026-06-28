import * as THREE from 'three';
import type { IMaterial } from '../scene/types';
import { createWaterNormalMap, createWaterDiffuseMap } from '../environment/water-textures';

function wrap(m: THREE.Material): IMaterial {
  return {
    _vendor: m,
    dispose: () => m.dispose(),
  };
}

export function createWaterMaterial(color?: string, opacity?: number): IMaterial {
  const normTex = createWaterNormalMap();
  const diffTex = createWaterDiffuseMap();
  return wrap(new THREE.MeshStandardMaterial({
    map: diffTex,
    normalMap: normTex,
    normalScale: new THREE.Vector2(0.6, 0.6),
    color: color ?? '#2090d0',
    roughness: 0.15,
    metalness: 0.05,
    transparent: true,
    opacity: opacity ?? 0.82,
    envMapIntensity: 1.0,
  }));
}

export function createSkyMaterial(): IMaterial {
  return wrap(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
}

export function createRingMaterial(): IMaterial {
  return wrap(new THREE.MeshBasicMaterial({
    color: 0x6090b0,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.25,
  }));
}
