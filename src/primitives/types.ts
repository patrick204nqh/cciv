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

export interface CylinderParams {
  rTop: number;
  rBot: number;
  height: number;
  radialSegments?: number;
  heightSegments?: number;
}

export interface SphereParams {
  radius: number;
  widthSegments?: number;
  heightSegments?: number;
}

export interface PlaneParams {
  w: number;
  h: number;
  segW?: number;
  segH?: number;
}

export interface LatheParams {
  points: Array<{ x: number; y: number }>;
  segments?: number;
}
