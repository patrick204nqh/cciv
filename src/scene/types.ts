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

export interface IScene extends SceneHandle {
  fog: FogSpec | null;
  background: string | null;
  getObjectByName(name: string): ISceneObject | undefined;
  traverse(fn: (obj: ISceneObject) => void): void;
  createMesh(geometry: import('three').BufferGeometry, material: IMaterial): ISceneObject;

  createDirectionalLight(color: string, intensity: number): ISceneObject;
  createAmbientLight(color: string, intensity: number): ISceneObject;
  createHemisphereLight(skyColor: string, groundColor: string, intensity: number): ISceneObject;
  createPlaneGeometry(width: number, height: number, segW: number, segH: number): import('three').BufferGeometry;
  createSphereGeometry(radius: number, widthSeg: number, heightSeg: number): import('three').BufferGeometry;
  createPoints(geometry: import('three').BufferGeometry, material: IMaterial): ISceneObject;
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
