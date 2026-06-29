import {
  WebGPURenderer, PerspectiveCamera, Scene, FogExp2, Color, PCFSoftShadowMap, ACESFilmicToneMapping,
} from 'three/webgpu';
import { wallClock } from './tsl-fft';
import type { IScene } from '../graphics/types';
import { SceneAdapter } from '../graphics/scene-adapter';
import { OrbitControls } from '../three/addons';
import { createOrbitControls } from '../controls/orbitControls';
import type { IRenderer, ICamera, ICameraControls, Vec3Like } from './types';

export interface RenderingModuleOptions {
  container?: HTMLElement;
  renderer?: any;
  camera?: PerspectiveCamera;
  onBeforeRender?: (dt: number) => void;
}

export class RenderingModule {
  readonly _renderer: any;
  readonly _camera: PerspectiveCamera;
  readonly controls: ICameraControls;
  readonly sceneHandle: IScene;
  private _scene: Scene;
  private container: HTMLElement;
  private onBeforeRender?: (dt: number) => void;

  get renderer(): IRenderer {
    const r = this._renderer;
    return {
      get domElement() { return r.domElement; },
      get info() { return r.info; },
      dispose: () => r.dispose(),
    };
  }

  get camera(): ICamera {
    const c = this._camera;
    return {
      get aspect() { return c.aspect; },
      get position() {
        const p = c.position;
        return { x: p.x, y: p.y, z: p.z };
      },
      set position(v: Vec3Like) { c.position.set(v.x, v.y, v.z); },
      get fov() { return c.fov; },
      get near() { return c.near; },
      get far() { return c.far; },
      updateProjectionMatrix: () => c.updateProjectionMatrix(),
      _vendorCam: c,
    } as any;
  }

  constructor(opts?: RenderingModuleOptions) {
    this.container = opts?.container ?? document.body;
    this.onBeforeRender = opts?.onBeforeRender;

    this._scene = new Scene();
    this._scene.fog = new FogExp2(0x406888, 0.0018);
    this._scene.background = new Color(0x5080a0);

    this._renderer = opts?.renderer ?? (() => {
      const supportsWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
      const r = new WebGPURenderer({ antialias: true, forceWebGL: !supportsWebGPU });
      r.setPixelRatio(Math.min(devicePixelRatio, 2));
      r.setSize(innerWidth, innerHeight);
      r.shadowMap.enabled = true;
      r.shadowMap.type = PCFSoftShadowMap;
      r.toneMapping = ACESFilmicToneMapping;
      r.toneMappingExposure = 1.15;
      this.container.appendChild(r.domElement);
      return r;
    })();

    this.sceneHandle = new SceneAdapter(this._scene, this._renderer);

    this._camera = opts?.camera ?? new PerspectiveCamera(45, innerWidth / innerHeight, 0.5, 2000);
    this._camera.position.set(140, 65, -90);

    const rawControls = createOrbitControls(this._camera, this._renderer.domElement);
    this.controls = {
      get target() { return rawControls.target as unknown as Vec3Like; },
      set autoRotate(v: boolean) { rawControls.autoRotate = v; },
      get autoRotate() { return rawControls.autoRotate; },
      update: () => rawControls.update(),
      dispose: () => rawControls.dispose(),
    };

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    this._camera.aspect = innerWidth / innerHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(innerWidth, innerHeight);
  };

  async startLoop(): Promise<void> {
    await this._renderer.init();
    this.sceneHandle.flushEnvironment();
    let prevTime = performance.now();
    const loop = () => {
      requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      this.onBeforeRender?.(dt);

      (this.sceneHandle as any).onBeforeRender?.(this._camera.position);

      wallClock.value = performance.now() / 1000;

      this.controls.update();
      this._renderer.render(this._scene, this._camera);
    };
    loop();
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this._renderer.dispose();
    this.controls.dispose();
  }
}
