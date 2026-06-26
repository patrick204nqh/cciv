import * as THREE from 'three';
import { loadTextureSet } from '../textures';
import type { MaterialSpec } from './types';

export type QualityLevel = 'low' | 'medium' | 'high';

const SIDE_MAP: Record<string, THREE.Side> = {
  front: THREE.FrontSide,
  back: THREE.BackSide,
  double: THREE.DoubleSide,
};

export class MaterialRegistry {
  private cache = new Map<string, THREE.MeshStandardMaterial>();
  private quality: QualityLevel = 'medium';

  setQualityLevel(level: QualityLevel): void {
    this.quality = level;
  }

  getOrCreate(spec: MaterialSpec): THREE.MeshStandardMaterial {
    const key = this.key(spec);
    const existing = this.cache.get(key);
    if (existing) return existing;

    const tex = spec.textureKey ? loadTextureSet(spec.textureKey) : {};

    const mat = new THREE.MeshStandardMaterial({
      map: tex.map,
      normalMap: this.quality !== 'low' ? tex.normalMap : undefined,
      roughnessMap: tex.roughnessMap,
      metalnessMap: tex.metalnessMap,
      alphaMap: tex.alphaMap,
      aoMap: tex.aoMap,
      roughness: spec.roughness ?? 0.88,
      metalness: spec.metalness ?? 0.02,
    });

    if (spec.color != null) mat.color.setHex(spec.color);
    if (spec.transparent) mat.transparent = true;
    if (spec.alphaTest != null) mat.alphaTest = spec.alphaTest;
    if (spec.side) mat.side = SIDE_MAP[spec.side] ?? THREE.FrontSide;

    this.cache.set(key, mat);
    return mat;
  }

  dispose(): void {
    for (const mat of this.cache.values()) mat.dispose();
    this.cache.clear();
  }

  private key(spec: MaterialSpec): string {
    const parts = [
      spec.textureKey ?? '',
      spec.color ?? '',
      spec.roughness ?? '',
      spec.metalness ?? '',
      spec.transparent ?? '',
      spec.alphaTest ?? '',
      spec.side ?? '',
    ];
    return parts.join('|');
  }
}

export const materialRegistry = new MaterialRegistry();
