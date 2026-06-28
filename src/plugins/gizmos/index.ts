import { Object3D, Mesh, Camera, Raycaster, Vector2 } from 'three';
import { TransformControls } from '../../three/addons';
import type { ScenePlugin, PluginContext } from '../types';
import type { ISceneObject } from '../../scene/types';
import { SceneObject } from '../../scene/object';

function vendorOf(obj: ISceneObject): Object3D {
  return (obj as any)._obj;
}

export const gizmosPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let controls: TransformControls;
  let vendorCam: Camera;
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  function onPointerDown(e: PointerEvent) {
    if (controls.enabled === false) return;
    const rect = ctx.renderer!.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, vendorCam);

    const meshes: Object3D[] = [];
    ctx.scene.traverse(child => {
      const vendor = vendorOf(child);
      if (vendor instanceof Mesh) meshes.push(vendor);
    });

    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      ctx.selectedObject = hits[0].object as any;
      controls.attach(hits[0].object);
      (controls as any).visible = true;
    } else {
      ctx.selectedObject = null;
      controls.detach();
      (controls as any).visible = false;
    }
  }

  return {
    id: 'gizmos',
    label: 'Gizmos',
    modes: new Set(['edit']),
    priority: 11,

    init(k: PluginContext) {
      ctx = k;
      vendorCam = (k.camera as any)._vendorCam;
      controls = new TransformControls(vendorCam, ctx.renderer!.domElement);
      controls.setMode('translate');
      controls.setSize(0.8);
      (controls as any).visible = false;
      ctx.scene.add(new SceneObject((controls as any)._root));

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
