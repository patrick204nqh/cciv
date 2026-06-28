import { RenderingModule, RenderingModuleOptions } from './rendering/module';
import { StateStore } from './state/store';
import { LocationTracker } from './state/location-tracker';
import { PluginManager } from './plugins/plugin-manager';
import { createPluginStateAPI } from './plugins/plugin-state-api';
import { createPluginSceneAPI } from './plugins/plugin-scene-api';
import { createDefaultState } from './state/defaults';
import { entityManager } from './entity/manager';
import type { PluginContext, ScenePlugin } from './plugins/types';

export interface KernelOptions extends RenderingModuleOptions {}

export class Kernel {
  readonly rendering: RenderingModule
  readonly store: StateStore
  readonly plugins: PluginManager
  private _mode: 'edit' | 'play' = 'edit'
  selectedObject: THREE.Object3D | null = null
  private locationTracker: LocationTracker

  get mode() { return this._mode }
  get scene() { return this.rendering.scene }
  get renderer() { return this.rendering.renderer }
  get camera() { return this.rendering.camera }
  get controls() { return this.rendering.controls }
  get registry() { return this.plugins.registry }

  setMode(m: 'edit' | 'play'): void {
    const prev = this._mode
    if (prev === m) return
    this._mode = m
    entityManager.setPaused(m === 'edit')
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
  }

  private onBeforeRender(dt: number): void {
    this.plugins.render(dt, this.mode)
  }

  private createPluginContext(): PluginContext {
    const self = this;
    return {
      scene: createPluginSceneAPI(this.rendering.scene),
      state: createPluginStateAPI(this.store),
      get mode() { return self.mode; },
      renderer: this.renderer,
      camera: this.camera,
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

  startLoop(): void {
    this.rendering.startLoop()
  }
}
