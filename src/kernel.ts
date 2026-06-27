import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createOrbitControls } from './controls/orbitControls';
import { StateStore } from './state/store';
import { PluginRegistry } from './plugins/registry';
import { createDefaultState } from './state/defaults';
import type { Kernel as KernelInterface, ScenePlugin } from './plugins/types';

export class Kernel implements KernelInterface {
  readonly scene: THREE.Scene
  readonly renderer: THREE.WebGLRenderer
  readonly camera: THREE.PerspectiveCamera
  readonly controls: OrbitControls
  readonly store: StateStore
  readonly registry: PluginRegistry
  readonly container: HTMLElement
  private _mode: 'edit' | 'play' = 'edit'
  selectedObject: THREE.Object3D | null = null
  private initialized = false

  get mode() { return this._mode }
  set mode(m: 'edit' | 'play') {
    const prev = this._mode
    if (prev === m) return
    this._mode = m
    for (const p of this.registry.getAll()) {
      p.onModeSwitch?.(prev, m)
    }
  }

  constructor(container?: HTMLElement) {
    this.container = container ?? document.body
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x406888, 0.0018)
    this.scene.background = new THREE.Color(0x5080a0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.setSize(innerWidth, innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.5, 2000)
    this.camera.position.set(140, 65, -90)

    this.controls = createOrbitControls(this.camera, this.renderer.domElement)
    this.store = new StateStore(createDefaultState())
    this.registry = new PluginRegistry()
  }

  registerPlugin(plugin: ScenePlugin): void {
    this.registry.register(plugin)
    if (this.initialized && plugin.modes.has(this.mode)) {
      plugin.init(this)
    }
  }

  async init(): Promise<void> {
    for (const p of this.registry.getActive(this.mode)) {
      p.init(this)
    }
    this.initialized = true
    window.addEventListener('resize', this.onResize)
  }

  private onResize = () => {
    this.camera.aspect = innerWidth / innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(innerWidth, innerHeight)
  }

  startLoop(): void {
    let prevTime = performance.now()
    const loop = () => {
      requestAnimationFrame(loop)
      const now = performance.now()
      const dt = Math.min((now - prevTime) / 1000, 0.05)
      prevTime = now

      for (const p of this.registry.getActive(this.mode)) {
        p.render?.(dt)
      }
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
    }
    loop()
  }
}
