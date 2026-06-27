export interface ExtractedModelDef {
  type: 'extracted';
  provider: string;
  asset: string;
  transform?: {
    scale?: number | [number, number, number];
    rotation?: [number, number, number];
    position?: [number, number, number];
  };
  materialOverrides?: Record<string, {
    color?: number;
    roughness?: number;
    metalness?: number;
    transparent?: boolean;
    alphaTest?: number;
  }>;
}

export interface ProceduralModelDef {
  type: 'procedural';
  generator: string;
  params: Record<string, number>;
  material?: {
    color?: number;
    roughness?: number;
    metalness?: number;
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
  transform?: {
    scale?: number | [number, number, number];
  };
}

export type PipelineModelConfig = ExtractedModelDef | ProceduralModelDef | CompositeModelDef;

export interface ModelMetadata {
  id: string;
  type: string;
  polyCount?: number;
  license?: string;
}
