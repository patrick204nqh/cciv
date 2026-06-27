import type { BufferGeometry } from 'three';

export type PrimitiveFn<P = Record<string, number>> = (params: P) => BufferGeometry;

export interface BoxParams {
  w: number;
  h: number;
  d: number;
  segW?: number;
  segH?: number;
  segD?: number;
}
