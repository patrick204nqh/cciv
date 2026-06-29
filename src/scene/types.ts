export interface Vec3Like {
  x: number; y: number; z: number;
}

export interface ReadonlyVec3Like {
  readonly x: number; readonly y: number; readonly z: number;
}

export interface EulerLike {
  x: number; y: number; z: number;
}

export interface QuatLike {
  x: number; y: number; z: number; w: number;
}

export interface SceneHandle {
  add(child: ISceneObject): void;
  remove(child: ISceneObject): void;
}

export interface FogSpec {
  type: 'exp2' | 'linear';
  color: string;
  density?: number;
  near?: number;
  far?: number;
}

import type { BufferGeometry as ThreeBufferGeometry } from 'three';

export const BACK_SIDE = 1; // THREE.BackSide
export type GeometryHandle = ThreeBufferGeometry;

export interface IScene extends SceneHandle {
  fog: FogSpec | null;
  background: string | null;
  getObjectByName(name: string): ISceneObject | undefined;
  traverse(fn: (obj: ISceneObject) => void): void;
  createMesh(geometry: GeometryHandle, material: IMaterial): ISceneObject;

  createDirectionalLight(color: string, intensity: number): ISceneObject;
  createAmbientLight(color: string, intensity: number): ISceneObject;
  createHemisphereLight(skyColor: string, groundColor: string, intensity: number): ISceneObject;
  createPlaneGeometry(width: number, height: number, segW: number, segH: number): GeometryHandle;
  createSphereGeometry(radius: number, widthSeg: number, heightSeg: number): GeometryHandle;
  createPoints(geometry: GeometryHandle, material: IMaterial): ISceneObject;

  /** Create an empty geometry. Use setAttribute/setIndex to populate. */
  createBufferGeometry(): GeometryHandle;
  /** Set a Float32 attribute on a geometry (position, color, etc.). */
  setAttribute(geo: GeometryHandle, name: string, data: Float32Array, itemSize: number): void;
  /** Set the index buffer on a geometry. */
  setIndex(geo: GeometryHandle, data: Uint16Array): void;
  /** Flag a geometry attribute as needing a GPU upload. */
  markAttributeDirty(geo: GeometryHandle, name: string): void;

  /** Create a texture from a canvas element. */
  createCanvasTexture(canvas: HTMLCanvasElement): any;
}

export interface IMaterial {
  dispose(): void;
  _vendor?: any;
}

export interface ISceneObject {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly userData: Record<string, any>;
  position: Vec3Like;
  rotation: EulerLike;
  scale: Vec3Like;
  visible: boolean;

  readonly worldPosition: ReadonlyVec3Like;
  readonly worldQuaternion: QuatLike;
  readonly forward: ReadonlyVec3Like;
  readonly right: ReadonlyVec3Like;
  readonly up: ReadonlyVec3Like;

  readonly parent: ISceneObject | null;
  readonly children: readonly ISceneObject[];

  addChild(child: ISceneObject): this;
  removeChild(child: ISceneObject): this;
  detach(): this;
  findChild(predicate: (child: ISceneObject) => boolean, deep?: boolean): ISceneObject | null;

  traverse(fn: (child: ISceneObject) => void): this;
  traverseAncestors(fn: (ancestor: ISceneObject) => void): this;
  traverseMeshes(fn: (obj: ISceneObject) => void): this;

  updateWorldMatrix(updateParents: boolean, updateChildren: boolean): void;
  clone(): ISceneObject;
  dispose(): void;

  getWorldMatrix(): Float32Array;
  getGeometryData(): { positions: Float32Array; indices: Uint16Array | Uint32Array } | null;
}
