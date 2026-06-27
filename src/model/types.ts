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

export interface ExtractedModelDef {
  type: 'extracted';
  provider: string;
  asset: string;
  textureKeys?: Record<string, string>;
  transform?: TransformSpec;
  materialOverrides?: Record<string, Partial<MaterialSpec>>;
  metadata?: {
    license?: string;
    sourceUrl?: string;
    polyCount?: number;
  };
}

export interface ProceduralModelDef {
  type: 'procedural';
  generator: string;
  params: Record<string, number>;
  material?: Partial<MaterialSpec>;
  metadata?: {
    license?: string;
    polyCount?: number;
  };
}

export interface CompositePart {
  primitive?: string;
  params?: Record<string, number>;
  model?: string;
  transform?: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
  };
}

export interface CompositeModelDef {
  type: 'composite';
  parts: CompositePart[];
  transform?: TransformSpec;
}

export type ModelConfig = ExtractedModelDef | ProceduralModelDef | CompositeModelDef;
