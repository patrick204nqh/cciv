import * as THREE from 'three';

export function traverseMeshes(
  root: THREE.Object3D,
  fn: (mesh: THREE.Mesh, material: THREE.MeshStandardMaterial) => void,
): void {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      fn(child, child.material);
    }
  });
}
