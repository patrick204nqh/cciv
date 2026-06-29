import type { IScene } from '../graphics/types';
import type { Disposer } from '../util/disposer';

export type { SceneHandle } from '../graphics/types';

export interface SceneEntity {
  readonly id: string;
  onAttach(scene: IScene, disposer?: Disposer): void;
  onBeforeUpdate?(dt: number): void;
  onUpdate?(dt: number): void;
  onDetach(): void;
}
