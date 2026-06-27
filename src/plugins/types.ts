import * as THREE from 'three';
import { StateStore } from '../state/store';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface Kernel {
  readonly scene: THREE.Scene
  readonly renderer: THREE.WebGLRenderer
  readonly camera: THREE.PerspectiveCamera
  readonly controls: OrbitControls
  readonly store: StateStore
  mode: 'edit' | 'play'
  readonly container: HTMLElement
  selectedObject: THREE.Object3D | null
}

export interface ScenePlugin {
  readonly id: string
  readonly label: string
  readonly modes: Set<'edit' | 'play'>
  readonly priority: number
  init(kernel: Kernel): void
  destroy(): void
  onModeSwitch?(from: 'edit' | 'play', to: 'edit' | 'play'): void
  render?(dt: number): void
}
