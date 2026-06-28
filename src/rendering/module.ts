import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import type { IScene } from '../scene/types';
import { SceneAdapter } from '../scene/scene-adapter';
import { OrbitControls } from '../three/addons';
import { createOrbitControls } from '../controls/orbitControls';
import type { IRenderer, ICamera } from './types';

export interface RenderingModuleOptions {
  container?: HTMLElement;
  renderer?: any;
  camera?: THREE.PerspectiveCamera;
  onBeforeRender?: (dt: number) => void;
}

export class RenderingModule {
  readonly _renderer: any;
  readonly _camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly sceneHandle: IScene;
  private _scene: THREE.Scene;
  private container: HTMLElement;
  private onBeforeRender?: (dt: number) => void;

  get renderer(): IRenderer {
    const r = this._renderer;
    return {
      get domElement() { return r.domElement; },
      get info() { return r.info; },
      get raw() { return r; },
      dispose: () => r.dispose(),
    };
  }

  get camera(): ICamera {
    const c = this._camera;
    return {
      get raw() { return c; },
      get aspect() { return c.aspect; },
      updateProjectionMatrix: () => c.updateProjectionMatrix(),
    };
  }

  constructor(opts?: RenderingModuleOptions) {
    this.container = opts?.container ?? document.body;
    this.onBeforeRender = opts?.onBeforeRender;

    this._scene = new THREE.Scene();
    this._scene.fog = new THREE.FogExp2(0x406888, 0.0018);
    this._scene.background = new THREE.Color(0x5080a0);
    this.sceneHandle = new SceneAdapter(this._scene);

    this._renderer = opts?.renderer ?? (() => {
      const r = new WebGPURenderer({ antialias: true, forceWebGL: true });
      r.setPixelRatio(Math.min(devicePixelRatio, 2));
      r.setSize(innerWidth, innerHeight);
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.15;
      this.container.appendChild(r.domElement);
      return r;
    })();

    this._camera = opts?.camera ?? new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.5, 2000);
    this._camera.position.set(140, 65, -90);

    this.controls = createOrbitControls(this._camera, this._renderer.domElement);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    this._camera.aspect = innerWidth / innerHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(innerWidth, innerHeight);
  };

  async startLoop(): Promise<void> {
    await this._renderer.init();
    let prevTime = performance.now();
    const loop = () => {
      requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      this.onBeforeRender?.(dt);

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
