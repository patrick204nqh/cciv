import * as THREE from 'three';
import { TransformControls } from '../../three/addons';
import type { ScenePlugin, PluginContext } from '../types';

export const gizmosPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let controls: TransformControls;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerDown(e: PointerEvent) {
    if (controls.enabled === false) return;
    const rect = ctx.renderer!.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, ctx.camera!.raw);

    const meshes: THREE.Object3D[] = [];
    ctx.scene.traverse(child => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });

    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      ctx.selectedObject = hits[0].object;
      controls.attach(hits[0].object);
      controls.visible = true;
    } else {
      ctx.selectedObject = null;
      controls.detach();
      controls.visible = false;
    }
  }

  return {
    id: 'gizmos',
    label: 'Gizmos',
    modes: new Set(['edit']),
    priority: 11,

    init(k: PluginContext) {
      ctx = k;
      controls = new TransformControls(ctx.camera!.raw, ctx.renderer!.domElement);
      controls.setMode('translate');
      controls.setSize(0.8);
      controls.visible = false;
      ctx.scene.add(controls);

      ctx.renderer!.domElement.addEventListener('pointerdown', onPointerDown);
      controls.addEventListener('mouseDown', () => controls.enabled = false);
      controls.addEventListener('mouseUp', () => controls.enabled = true);
    },

    destroy() {
      controls.dispose();
      ctx.renderer!.domElement.removeEventListener('pointerdown', onPointerDown);
    },
  };
})();
