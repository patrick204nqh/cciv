import type { Object3D } from 'three';
import type { Disposer } from '../util/disposer';

export interface SceneHandle {
  add(child: Object3D): void;
  remove(child: Object3D): void;
}

export interface SceneEntity {
  readonly id: string;
  onAttach(scene: SceneHandle, disposer?: Disposer): void;
  onBeforeUpdate?(dt: number): void;
  onUpdate?(dt: number): void;
  onDetach(): void;
}
