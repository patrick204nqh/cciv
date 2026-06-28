import * as THREE from 'three';
import type { ISceneObject } from '../scene/types';

export function traverseMeshes(
  root: ISceneObject,
  fn: (mesh: THREE.Mesh, material: THREE.MeshStandardMaterial) => void,
): void {
  root.object3D.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      fn(child, child.material);
    }
  });
}
