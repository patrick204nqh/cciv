import type { ModelEntity } from '../model/types';

export interface ModelCatalogEntry {
  glb: string;
  provider?: string;
  polyCount?: number;
  license?: string;
  materialOverrides?: Record<string, {
    color?: number;
    roughness?: number;
    metalness?: number;
    transparent?: boolean;
    alphaTest?: number;
  }>;
  transform?: {
    scale?: number | [number, number, number];
    rotation?: [number, number, number];
    position?: [number, number, number];
  };
}

export interface ModelCatalog {
  [id: string]: ModelCatalogEntry;
}

export interface ModelLoader {
  load(ref: string): Promise<ModelEntity>;
  preload(refs: string[]): Promise<void>;
  getCached(ref: string): ModelEntity | undefined;
  clearCache(): void;
}
