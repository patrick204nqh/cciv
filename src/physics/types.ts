import type { Vec3Like } from '../graphics/types';
import type { ISceneObject } from '../graphics/types';

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

export interface IPhysicsWorld {
  readonly gravity: number;
  readonly fixedDt: number;
  step(dt: number): void;
  createBody(config: PhysicsBodyConfig): IPhysicsBody;
  addBody(body: IPhysicsBody): void;
  removeBody(body: IPhysicsBody): void;
  reset(): void;
  dispose(): void;
}

export interface IPhysicsBody {
  readonly position: Vec3Like;
  readonly velocity: Vec3Like;
  readonly angularVelocity: Vec3Like;
  readonly quaternion: Vec3Like & { w: number };
  setPosition(x: number, y: number, z: number): void;
  setVelocity(x: number, y: number, z: number): void;
  applyLocalForce(x: number, y: number, z: number): void;
  applyForce(force: [number, number, number], worldPoint: [number, number, number]): void;
  setTorque(x: number, y: number, z: number): void;
  setDamping(linear: number, angular: number): void;
  getMass(): number;
  setMass(mass: number): void;
  syncTransform(target: ISceneObject): void;
  /** Serialized shape data for debug rendering. Returns null if no geometry-backed shape. */
  getShapeData(): { positions: Float32Array; indices: Uint16Array | Uint32Array } | null;
  dispose(): void;
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
