import { MeshStandardMaterial, MeshBasicMaterial, Vector2, BackSide } from 'three';
import type { IMaterial } from '../scene/types';
import { createWaterNormalMap, createWaterDiffuseMap } from '../environment/water-textures';

function wrap(m: MeshStandardMaterial | MeshBasicMaterial): IMaterial {
  return {
    _vendor: m,
    dispose: () => m.dispose(),
  } as IMaterial;
}

export function createWaterMaterial(color?: string, opacity?: number): IMaterial {
  const normTex = createWaterNormalMap();
  const diffTex = createWaterDiffuseMap();
  return wrap(new MeshStandardMaterial({
    map: diffTex,
    normalMap: normTex,
    normalScale: new Vector2(0.6, 0.6),
    color: color ?? '#2090d0',
    roughness: 0.15,
    metalness: 0.05,
    transparent: true,
    opacity: opacity ?? 0.82,
    envMapIntensity: 1.0,
  }));
}

export function createSkyMaterial(): IMaterial {
  return wrap(new MeshBasicMaterial({ vertexColors: true, side: BackSide }));
}

export function createRingMaterial(): IMaterial {
  return wrap(new MeshBasicMaterial({
    color: 0x6090b0,
    side: BackSide,
    transparent: true,
    opacity: 0.25,
  }));
}
