import { Raycaster, Vector2 } from 'three';
import { TransformControls } from '../../three/addons';
import type { ScenePlugin, PluginContext } from '../types';
import type { ISceneObject } from '../../scene/types';
import { SceneObject } from '../../scene/object';
import { useSelectionStore, type GizmoMode } from '../../ui/stores/selection-store';

function vendorOf(obj: ISceneObject) {
  return (obj as any)._obj;
}

export const gizmosPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let controls: TransformControls;
  let vendorCam: any;
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let onKey: (e: KeyboardEvent) => void;
  let unsubStore: (() => void) | null = null;

  function syncGizmoMode(mode: GizmoMode) {
    controls.setMode(mode);
  }

  function onPointerDown(e: PointerEvent) {
    if (controls.enabled === false) return;
    const rect = ctx.renderer!.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, vendorCam);

    const meshes: any[] = [];
    ctx.scene.traverse(child => {
      if (child.type !== 'Mesh') return;
      meshes.push(vendorOf(child));
    });

    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      const id = (hits[0].object as any).id;
      ctx.selectedObject = hits[0].object as any;
      controls.attach(hits[0].object);
      (controls as any).visible = true;
      useSelectionStore.getState().setSelected(id);
    } else {
      ctx.selectedObject = null;
      controls.detach();
      (controls as any).visible = false;
      useSelectionStore.getState().setSelected(null);
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
      controls.setMode(useSelectionStore.getState().gizmoMode);
      controls.setSize(0.8);
      (controls as any).visible = false;
      ctx.scene.add(new SceneObject((controls as any)._root));

      ctx.state.watch(s => s.activeLocation, () => {
        controls.detach();
        ctx.selectedObject = null;
        useSelectionStore.getState().setSelected(null);
      });

      ctx.renderer!.domElement.addEventListener('pointerdown', onPointerDown);
      controls.addEventListener('mouseDown', () => controls.enabled = false);
      controls.addEventListener('mouseUp', () => controls.enabled = true);

      unsubStore = useSelectionStore.subscribe((state) => {
        controls.setMode(state.gizmoMode);
        controls.setTranslationSnap(state.snapEnabled ? state.snapStep : null);
      });

      onKey = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
        const k = e.key.toLowerCase();
        if (k === 't') { useSelectionStore.getState().setGizmoMode('translate'); e.preventDefault(); }
        if (k === 'r') { useSelectionStore.getState().setGizmoMode('rotate'); e.preventDefault(); }
        if (k === 's' && !e.ctrlKey && !e.metaKey) { useSelectionStore.getState().setGizmoMode('scale'); e.preventDefault(); }
        if (k === 'x') { useSelectionStore.getState().toggleSnap(); e.preventDefault(); }
      };
      window.addEventListener('keydown', onKey);
    },

    destroy() {
      unsubStore?.();
      controls.dispose();
      ctx.renderer!.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    },
  };
})();
