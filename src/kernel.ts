import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createOrbitControls } from './controls/orbitControls';
import { StateStore } from './state/store';
import { PluginRegistry } from './plugins/registry';
import { createDefaultState } from './state/defaults';
import { entityManager } from './entity/manager';
import type { PluginContext, ScenePlugin } from './plugins/types';

export interface KernelOptions {
  container?: HTMLElement;
  renderer?: THREE.WebGLRenderer;
  camera?: THREE.PerspectiveCamera;
}

export class Kernel {
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

  setMode(m: 'edit' | 'play'): void {
    const prev = this._mode
    if (prev === m) return
    this._mode = m
    entityManager.setPaused(m === 'edit')
    for (const p of this.registry.getAll()) {
      try {
        p.onModeSwitch?.(prev, m)
      } catch (e) {
        console.warn(`[kernel] onModeSwitch error in plugin "${p.id}":`, e)
      }
    }
  }

  constructor(opts?: KernelOptions) {
    this.container = opts?.container ?? document.body
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x406888, 0.0018)
    this.scene.background = new THREE.Color(0x5080a0)

    this.renderer = opts?.renderer ?? (() => {
      const r = new THREE.WebGLRenderer({ antialias: true })
      r.setPixelRatio(Math.min(devicePixelRatio, 2))
      r.setSize(innerWidth, innerHeight)
      r.shadowMap.enabled = true
      r.shadowMap.type = THREE.PCFSoftShadowMap
      r.toneMapping = THREE.ACESFilmicToneMapping
      r.toneMappingExposure = 1.15
      this.container.appendChild(r.domElement)
      return r
    })()

    this.camera = opts?.camera ?? new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.5, 2000)
    this.camera.position.set(140, 65, -90)

    this.controls = createOrbitControls(this.camera, this.renderer.domElement)
    this.store = new StateStore(createDefaultState())
    this.registry = new PluginRegistry()
  }

  private createPluginContext(): PluginContext {
    const self = this;
    return {
      scene: this.scene,
      store: this.store,
      get mode() { return self.mode; },
      renderer: this.renderer,
      camera: this.camera,
      get selectedObject() { return self.selectedObject; },
      set selectedObject(o) { self.selectedObject = o; },
      setMode: (m) => self.setMode(m),
    };
  }

  registerPlugin(plugin: ScenePlugin): void {
    this.registry.register(plugin)
    if (this.initialized && plugin.modes.has(this.mode)) {
      plugin.init(this.createPluginContext())
    }
  }

  async init(): Promise<void> {
    const ctx = this.createPluginContext()
    for (const p of this.registry.getActive(this.mode)) {
      p.init(ctx)
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
