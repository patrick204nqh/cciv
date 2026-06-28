import type { Camera, WebGLRenderer } from 'three';

export interface IRenderer {
  readonly domElement: HTMLElement;
  readonly info: WebGLRenderer['info'];
  readonly raw: WebGLRenderer;
  dispose(): void;
}

export interface ICamera {
  readonly raw: Camera;
  readonly aspect: number;
  updateProjectionMatrix(): void;
}
