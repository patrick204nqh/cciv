import type { ModelEntity } from '../model/types';
import type { MaterialSpec } from '../material/types';

export interface ModelCatalogEntry {
  glb: string;
  polyCount?: number;
  license?: string;
  materialOverrides?: Record<string, Partial<MaterialSpec>>;
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
