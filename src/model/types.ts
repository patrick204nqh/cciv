import type { ISceneObject } from '../graphics/types';
import type { SceneEntity } from '../entity/types';

export interface MaterialSpec {
  color?: number;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  alphaTest?: number;
  side?: 'front' | 'back' | 'double';
}

export type ModelSource = 'extracted' | 'procedural' | 'composite';

export interface ModelEntity {
  readonly id: string;
  readonly root: ISceneObject;
  readonly metadata: {
    id: string;
    source: ModelSource;
    license?: string;
    sourceUrl?: string;
    polyCount?: number;
  };
  dispose(): void;
  clone(): ModelEntity;
}

export interface DataGroup {
  type: 'data';
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
  uvs2?: number[];
  material?: Partial<MaterialSpec>;
}

export type GroupDefinition = DataGroup;

export interface ModelDefinition {
  groups: Record<string, GroupDefinition>;
  transform?: TransformSpec;
  metadata?: {
    license?: string;
    sourceUrl?: string;
  };
}

export interface TransformSpec {
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
  position?: [number, number, number];
}

// A model config says "how to compile my data into a GLB."
// The data itself lives in .cache/processed/<id>/ — how it got there is not our concern.
export interface ModelConfig {
  materialOverrides?: Record<string, Partial<MaterialSpec>>;
  transform?: TransformSpec;
  metadata?: {
    license?: string;
    sourceUrl?: string;
    polyCount?: number;
  };
}

// Types previously in loaders/types.ts — merged here for a single model type surface.

export interface ModelCatalogEntry {
  glb: string;
  polyCount?: number;
  license?: string;
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
  load(ref: string): Promise<ModelEntity>;
  preload(refs: string[]): Promise<void>;
  getCached(ref: string): ModelEntity | undefined;
  clearCache(): void;
}

export interface WorldLoadError {
  ref: string;
  error: Error;
}

export interface WorldLoadResult {
  entities: SceneEntity[];
  errors: WorldLoadError[];
  metadata: {
    loadedAt: number;
  };
}
