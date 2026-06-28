import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createOrbitControls } from '../controls/orbitControls';

export interface RenderingModuleOptions {
  container?: HTMLElement;
  renderer?: THREE.WebGLRenderer;
  camera?: THREE.PerspectiveCamera;
  onBeforeRender?: (dt: number) => void; // Callback for pre-render updates
}

export class RenderingModule {
  readonly scene: THREE.Scene;
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  private container: HTMLElement;
  private onBeforeRender?: (dt: number) => void;

  constructor(opts?: RenderingModuleOptions) {
    this.container = opts?.container ?? document.body;
    this.onBeforeRender = opts?.onBeforeRender;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x406888, 0.0018);
    this.scene.background = new THREE.Color(0x5080a0);

    this.renderer = opts?.renderer ?? (() => {
      const r = new THREE.WebGLRenderer({ antialias: true });
      r.setPixelRatio(Math.min(devicePixelRatio, 2));
      r.setSize(innerWidth, innerHeight);
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.15;
      this.container.appendChild(r.domElement);
      return r;
    })();

    this.camera = opts?.camera ?? new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.5, 2000);
    this.camera.position.set(140, 65, -90);

    this.controls = createOrbitControls(this.camera, this.renderer.domElement);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  };

  startLoop(): void {
    let prevTime = performance.now();
    const loop = () => {
      requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      this.onBeforeRender?.(dt); // Call external callback before rendering

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    this.controls.dispose();
    // Other disposals if necessary
  }
}
