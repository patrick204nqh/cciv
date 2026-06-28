import type { Camera, WebGLRenderer } from 'three';

export interface RendererHandle {
  readonly domElement: HTMLElement;
  readonly info: WebGLRenderer['info'];
  dispose(): void;
}

export interface CameraHandle {
  readonly raw: Camera;
  readonly aspect: number;
  updateProjectionMatrix(): void;
}
