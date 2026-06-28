export interface PhysicsWorldConfig {
  gravity?: number;
  fixedDt?: number;
}

export interface PhysicsBodyConfig {
  mass: number;
  shape: TrimeshShape | BoxShape | ConvexHullShape;
  position?: [number, number, number];
  quaternion?: [number, number, number, number];
}

export interface TrimeshShape {
  type: 'trimesh';
  positions: Float32Array;
  indices: Uint16Array | Uint32Array;
  scale?: number;
}

export interface BoxShape {
  type: 'box';
  halfExtents: [number, number, number];
}

export interface ConvexHullShape {
  type: 'convex';
  vertices: Float32Array;
  faces: number[][];
}

export interface BuoyancyConfig {
  density: number;
}

export interface HydrodynamicsConfig {
  density: number;
  dragCoefficient: number;
  slammingCoefficient: number;
  addedMassFactor: number;
}
