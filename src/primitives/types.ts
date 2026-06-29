export interface PrimitiveData {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array | Uint32Array;
}

export interface HullStation {
  z: number;
  sheerY: number;
  keelY: number;
  halfBreadths: number[];
}

export interface HullOptions {
  subdivisions?: number;
  stationSubdivisions?: number;
}

export interface ExtrudedOptions {
  y: number;
  yHeight: number;
  segments?: number;
  bevel?: number;
}

export interface BillboardOptions {
  width: number;
  height: number;
  origin: [number, number, number];
  belly: number;
  segmentsW?: number;
  segmentsH?: number;
}

export interface RiggingSegment {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
  segments?: number;
}
