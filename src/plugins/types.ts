import type { IScene, IRenderer, ICamera } from '../graphics/types';
import type { ISceneObject } from '../graphics/types';
import type { StateStore } from '../state/store';

export interface PluginContext {
  readonly scene: IScene
  readonly state: StateStore
  readonly mode: 'edit' | 'play'
  readonly renderer?: IRenderer
  readonly camera?: ICamera
  selectedObject: ISceneObject | null
  setMode(m: 'edit' | 'play'): void
}

export interface ScenePlugin {
  readonly id: string
  readonly label: string
  readonly modes: Set<'edit' | 'play'>
  readonly priority: number
  init(ctx: PluginContext): void
  destroy(): void
  onModeSwitch?(from: 'edit' | 'play', to: 'edit' | 'play'): void
  render?(dt: number): void
}
