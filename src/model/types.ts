import type { MaterialSpec } from '../material/types';

export type ModelSource = 'extracted' | 'procedural' | 'composite';

export interface ModelEntity {
  readonly id: string;
  readonly root: import('three').Group;
  readonly metadata: {
    id: string;
    source: ModelSource;
    license?: string;
    sourceUrl?: string;
    polyCount?: number;
  };
  dispose(): void;
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
