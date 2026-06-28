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
}

export interface IMaterial {
  readonly raw: import('three').Material;
}

export interface ISceneObject {
  readonly object3D: import('three').Object3D;

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

  clone(): ISceneObject;
  dispose(): void;
}
