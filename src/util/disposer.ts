import * as THREE from 'three';

export type Disposable = THREE.BufferGeometry | THREE.Material | THREE.Object3D | (() => void);

export class Disposer {
  private items: Disposable[] = [];

  add(item: Disposable): void {
    this.items.push(item);
  }

  dispose(): void {
    for (const item of this.items) {
      if (typeof item === 'function') item();
    }
    for (const item of this.items) {
      if (item instanceof THREE.Object3D) {
        item.removeFromParent();
      } else if (item instanceof THREE.Material) {
        item.dispose();
      } else if (item instanceof THREE.BufferGeometry) {
        item.dispose();
      }
    }
    this.items.length = 0;
  }
}
