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

export class ModelLoadError extends Error {
  constructor(message: string, public readonly ref: string) {
    super(message);
    this.name = 'ModelLoadError';
  }
}

export interface ModelLoader {
  /** Load a model by reference. Rejects with ModelLoadError on failure. */
  load(ref: string): Promise<ModelEntity>;
  preload(refs: string[]): Promise<void>;
  getCached(ref: string): ModelEntity | undefined;
  clearCache(): void;
}
