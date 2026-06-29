import type { PluginStateAPI } from './plugin-state-api';
import type { PluginSceneAPI } from './plugin-scene-api';
import type { IRenderer, ICamera } from '../graphics/types';
import type { ISceneObject } from '../graphics/types';

export interface PluginContext {
  readonly scene: PluginSceneAPI
  readonly state: PluginStateAPI
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
