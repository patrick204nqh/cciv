import { RenderingModule, RenderingModuleOptions } from './rendering/module';
import { StateStore } from './state/store';
import { LocationTracker } from './state/location-tracker';
import { PluginManager } from './plugins/plugin-manager';
import { createPluginStateAPI } from './plugins/plugin-state-api';
import { createPluginSceneAPI } from './plugins/plugin-scene-api';
import { createDefaultState } from './state/defaults';
import { entityManager } from './entity/manager';
import { FollowCamera } from './controls/follow-camera';
import type { PluginContext, ScenePlugin } from './plugins/types';
import type { Object3D } from 'three';

export interface KernelOptions extends RenderingModuleOptions {}

export class Kernel {
  readonly rendering: RenderingModule
  readonly store: StateStore
  readonly plugins: PluginManager
  readonly followCamera: FollowCamera
  private _mode: 'edit' | 'play' = 'edit'
  selectedObject: Object3D | null = null
  private locationTracker: LocationTracker

  get mode() { return this._mode }
  get scene() { return this.rendering.sceneHandle }
  get controls() { return this.rendering.controls }

  setMode(m: 'edit' | 'play'): void {
    const prev = this._mode
    if (prev === m) return
    this._mode = m
    entityManager.setPaused(m === 'edit')
    if (m === 'play') this.followCamera.enable()
    else this.followCamera.disable()
    this.plugins.onModeSwitch(prev, m)
  }

  constructor(opts?: KernelOptions) {
    this.rendering = new RenderingModule({
      ...opts,
      onBeforeRender: (dt) => this.onBeforeRender(dt),
    });

    this.store = new StateStore(createDefaultState())
    this.plugins = new PluginManager()
    this.locationTracker = new LocationTracker(this.store)
    this.followCamera = new FollowCamera()
    this.followCamera.init(this.rendering.controls)
  }

  private onBeforeRender(dt: number): void {
    this.followCamera.update()
    this.plugins.render(dt, this.mode)
  }

  private createPluginContext(): PluginContext {
    const self = this;
    const r = this.rendering;
    return {
      scene: createPluginSceneAPI(r.sceneHandle),
      state: createPluginStateAPI(this.store),
      get mode() { return self.mode; },
      renderer: r.renderer,
      camera: r.camera,
      get selectedObject() { return self.selectedObject; },
      set selectedObject(o) { self.selectedObject = o; },
      setMode: (m) => self.setMode(m),
    };
  }

  registerPlugin(plugin: ScenePlugin): void {
    this.plugins.register(plugin)
    if (this.plugins.isInitialized() && plugin.modes.has(this.mode)) {
      plugin.init(this.createPluginContext())
    }
  }

  async init(): Promise<void> {
    const ctx = this.createPluginContext()
    this.plugins.init(ctx, this.mode)
    this.locationTracker.start()
  }

  async startLoop(): Promise<void> {
    await this.rendering.startLoop()
  }
}
