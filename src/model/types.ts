import type { MaterialOverride } from '../state/types';
import type { ISceneObject } from '../scene/types';

export interface MaterialSpec {
  textureKey?: string;
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
  applyMaterials(materials: Record<string, MaterialOverride>): void;
}

export interface TransformSpec {
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
  position?: [number, number, number];
}

// A model config says "how to compile my data into a GLB."
// The data itself lives in .cache/models/<id>/ — how it got there is not our concern.
export interface ModelConfig {
  textureKeys?: Record<string, string>;
  materialOverrides?: Record<string, Partial<MaterialSpec>>;
  transform?: TransformSpec;
  metadata?: {
    license?: string;
    sourceUrl?: string;
    polyCount?: number;
  };
}
