import * as THREE from 'three';
import type { IMaterial } from '../scene/types';
import { MaterialAdapter } from '../scene/material-adapter';
import { createWaterNormalMap, createWaterDiffuseMap } from '../environment/water-textures';

export function createWaterMaterial(color?: string, opacity?: number): IMaterial {
  const normTex = createWaterNormalMap();
  const diffTex = createWaterDiffuseMap();
  return new MaterialAdapter(new THREE.MeshStandardMaterial({
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
  return new MaterialAdapter(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
}

export function createRingMaterial(): IMaterial {
  return new MaterialAdapter(new THREE.MeshBasicMaterial({
    color: 0x6090b0,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.25,
  }));
}

export function createWakeMaterial(): IMaterial {
  return new MaterialAdapter(new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
}

export function createSprayMaterial(): IMaterial {
  return new MaterialAdapter(new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.4,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    map: (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 8;
      const g = c.getContext('2d')!;
      g.beginPath();
      g.arc(4, 4, 2.5, 0, Math.PI * 2);
      g.fillStyle = '#fff';
      g.fill();
      return new THREE.CanvasTexture(c);
    })(),
  }));
}
