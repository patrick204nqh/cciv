import type { MaterialSpec } from '../material';

export type ModelSource = 'extracted' | 'procedural' | 'external';

export interface TransformSpec {
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
  position?: [number, number, number];
}

export interface ExtractedMeshGroup {
  name: string;
  type: 'extracted';
  pos: Float32Array;
  nml: Float32Array;
  uv: Float32Array;
  indices: Uint16Array | Uint32Array;
  uv2?: Float32Array;
  textureKey?: string;
}

export interface ProceduralMeshGroup {
  name: string;
  type: 'procedural';
  build: () => import('three').BufferGeometry;
  textureKey?: string;
}

export type MeshGroupSpec = ExtractedMeshGroup | ProceduralMeshGroup;

export interface ModelConfig {
  id: string;
  source: ModelSource;
  meshGroups: MeshGroupSpec[];
  transform?: TransformSpec;
  materialOverrides?: Record<string, Partial<MaterialSpec>>;
  metadata?: {
    license?: string;
    sourceUrl?: string;
    polyCount?: number;
  };
}

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
