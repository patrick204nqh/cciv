import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import type { ScenePlugin, Kernel } from '../types';

export const gizmosPlugin: ScenePlugin = (() => {
  let kernel: Kernel;
  let controls: TransformControls;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerDown(e: PointerEvent) {
    if (controls.enabled === false) return;
    const rect = kernel.renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, kernel.camera);

    const meshes: THREE.Object3D[] = [];
    kernel.scene.traverse(child => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });

    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      kernel.selectedObject = hits[0].object;
      controls.attach(hits[0].object);
      controls.visible = true;
    } else {
      kernel.selectedObject = null;
      controls.detach();
      controls.visible = false;
    }
  }

  return {
    id: 'gizmos',
    label: 'Gizmos',
    modes: new Set(['edit']),
    priority: 11,

    init(k: Kernel) {
      kernel = k;
      controls = new TransformControls(kernel.camera, kernel.renderer.domElement);
      controls.setMode('translate');
      controls.setSize(0.8);
      controls.visible = false;
      kernel.scene.add(controls);

      kernel.renderer.domElement.addEventListener('pointerdown', onPointerDown);
      controls.addEventListener('mouseDown', () => controls.enabled = false);
      controls.addEventListener('mouseUp', () => controls.enabled = true);
    },

    destroy() {
      controls.dispose();
      kernel.renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    },
  };
})();
