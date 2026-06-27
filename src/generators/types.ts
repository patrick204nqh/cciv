import type { BufferGeometry } from 'three';

export type GeneratorFn<P = Record<string, number>> = (params: P) => BufferGeometry;
