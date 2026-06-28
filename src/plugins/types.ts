import * as THREE from 'three';
import type { PluginStateAPI } from './plugin-state-api';
import type { PluginSceneAPI } from './plugin-scene-api';

export interface PluginContext {
  readonly scene: PluginSceneAPI
  readonly state: PluginStateAPI
  readonly mode: 'edit' | 'play'
  readonly renderer?: THREE.WebGLRenderer
  readonly camera?: THREE.PerspectiveCamera
  selectedObject: THREE.Object3D | null
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
