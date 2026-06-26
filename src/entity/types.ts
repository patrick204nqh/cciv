import * as THREE from 'three';

export interface SceneEntity {
  readonly id: string;
  onAttach(scene: THREE.Scene): void;
  onBeforeUpdate(dt: number): void;
  onUpdate(dt: number): void;
  onDetach(): void;
}
