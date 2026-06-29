import { RenderingModule, RenderingModuleOptions } from './graphics/module';
import { StateStore } from './state/store';
import { PluginManager } from './plugins/plugin-manager';
import { createDefaultState } from './state/defaults';
import { entityManager } from './entity/manager';
import { FollowCamera } from './controls/follow-camera';
import { WorldController } from './controller/world-controller';
import type { PluginContext, ScenePlugin } from './plugins/types';
import type { ISceneObject } from './graphics/types';

export interface KernelOptions extends RenderingModuleOptions {}

export class Kernel {
  readonly rendering: RenderingModule
  readonly store: StateStore
  readonly plugins: PluginManager
  readonly followCamera: FollowCamera
  readonly worldController: WorldController
  private _mode: 'edit' | 'play' = 'edit'
  selectedObject: ISceneObject | null = null

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
    this.followCamera = new FollowCamera()
    this.followCamera.init(this.rendering.controls)
    this.worldController = new WorldController(this.rendering.sceneHandle, this.store)
  }

  private onBeforeRender(dt: number): void {
    this.followCamera.update()
    this.plugins.render(dt, this.mode)
  }

  createPluginContext(): PluginContext {
    const self = this;
    const r = this.rendering;
    return {
      scene: r.sceneHandle,
      state: this.store,
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
  }

  setModelLoader(loader: import('./model/types').ModelLoader): void {
    this.worldController.setModelLoader(loader)
  }

  async startLoop(): Promise<void> {
    await this.rendering.startLoop()
  }
}
