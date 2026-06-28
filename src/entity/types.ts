import type { SceneHandle } from '../scene/types';
import type { Disposer } from '../util/disposer';

export type { SceneHandle } from '../scene/types';

export interface SceneEntity {
  readonly id: string;
  onAttach(scene: SceneHandle, disposer?: Disposer): void;
  onBeforeUpdate?(dt: number): void;
  onUpdate?(dt: number): void;
  onDetach(): void;
}
