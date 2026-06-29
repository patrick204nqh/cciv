export interface IRenderer {
  readonly domElement: HTMLElement;
  readonly info: object;
  dispose(): void;
}

export interface ICamera {
  readonly aspect: number;
  position: Vec3Like;
  readonly fov: number;
  readonly near: number;
  readonly far: number;
  updateProjectionMatrix(): void;
}

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

export class GeometryHandle {
  declare private _opaque: never;
}

export const FRONT_SIDE = 0;
export const BACK_SIDE = 1;
export const DOUBLE_SIDE = 2;

export interface IGeometryFactory {
  createPlaneGeometry(width: number, height: number, segW: number, segH: number): GeometryHandle;
  createSphereGeometry(radius: number, widthSeg: number, heightSeg: number): GeometryHandle;
  createBufferGeometry(): GeometryHandle;
  setAttribute(geo: GeometryHandle, name: string, data: Float32Array, itemSize: number): void;
  setIndex(geo: GeometryHandle, data: Uint16Array | Uint32Array): void;
  markAttributeDirty(geo: GeometryHandle, name: string): void;
  readAttribute(geo: GeometryHandle, name: string): Float32Array | null;
}

export interface IMaterialFactory {
  createCanvasTexture(canvas: HTMLCanvasElement): any;
  registerMaterial(material: IMaterial, vendor: any): void;
  createStandardMaterial(spec: MaterialSpec): IMaterial;
}

export interface MaterialSpec {
  color?: number | string;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  alphaTest?: number;
  side?: number;
}

export interface ILightFactory {
  createDirectionalLight(color: string, intensity: number): ISceneObject;
  createAmbientLight(color: string, intensity: number): ISceneObject;
  createHemisphereLight(skyColor: string, groundColor: string, intensity: number): ISceneObject;
}

export interface ISceneGraph extends SceneHandle {
  fog: FogSpec | null;
  background: string | null;
  getObjectByName(name: string): ISceneObject | undefined;
  traverse(fn: (obj: ISceneObject) => void): void;
  createGroup(name?: string): ISceneObject;
  createMesh(geometry: GeometryHandle, material: IMaterial): ISceneObject;
  createPoints(geometry: GeometryHandle, material: IMaterial): ISceneObject;
  /** Wrap a vendor (Three.js) Object3D into an ISceneObject. Used by GLB loading. */
  wrapObject3D(obj: any): ISceneObject;
}

export interface IScene extends ISceneGraph, IGeometryFactory, IMaterialFactory, ILightFactory {}

export interface IMaterial {
  color?: string;
  roughness?: number;
  metalness?: number;
  opacity: number;
  transparent: boolean;
  side: number;
  dispose(): void;
}

export interface ISceneObject {
  readonly id: string;
  name: string;
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
