export type ModelSource = 'extracted' | 'procedural' | 'external';

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
