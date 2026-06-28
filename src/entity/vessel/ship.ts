import type { SceneEntity, SceneHandle } from '../types';
import { bus } from '../../event-bus';
import type { ModelEntity } from '../../model/types';
import { waveSurface } from '../../environment/wave-surface';
import type { Disposer } from '../../util/disposer';

interface PrevState {
  x: number; y: number; z: number;
  qx: number; qy: number; qz: number; qw: number;
}

export function createVesselEntity(model: ModelEntity, vesselId?: string): SceneEntity {
  const id = vesselId ?? 'vessel';
  const prev: PrevState = { x: 0, y: 0, z: 0, qx: 0, qy: 0, qz: 0, qw: 1 };

  return {
    id,

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      scene.add(model.root);
      disposer?.add(model.root.object3D);
    },

    onBeforeUpdate() {
      const wp = model.root.worldPosition;
      const wq = model.root.worldQuaternion;
      prev.x = wp.x; prev.y = wp.y; prev.z = wp.z;
      prev.qx = wq.x; prev.qy = wq.y; prev.qz = wq.z; prev.qw = wq.w;
    },

    onUpdate(dt: number) {
      const pos = model.root.worldPosition;

      const { height: waveY, normal: n } = waveSurface.sample(pos.x, pos.z);

      const targetY = -1.5 + waveY;
      const targetRx = Math.atan2(n.z, n.y) * 0.5;
      const targetRz = -Math.atan2(n.x, n.y) * 0.5;

      const sy = Math.min(dt * 2.5, 1);
      const sr = Math.min(dt * 2, 1);

      model.root.position.y += (targetY - model.root.position.y) * sy;
      model.root.object3D.rotation.x += (targetRx - model.root.object3D.rotation.x) * sr;
      model.root.object3D.rotation.z += (targetRz - model.root.object3D.rotation.z) * sr;

      const newPos = model.root.worldPosition;
      const newQuat = model.root.worldQuaternion;

      if (newPos.x !== prev.x || newPos.y !== prev.y || newPos.z !== prev.z ||
          newQuat.x !== prev.qx || newQuat.y !== prev.qy ||
          newQuat.z !== prev.qz || newQuat.w !== prev.qw) {
        bus.emit('entity:position-changed', {
          entityId: id,
          x: newPos.x, y: newPos.y, z: newPos.z,
          qx: newQuat.x, qy: newQuat.y, qz: newQuat.z, qw: newQuat.w,
        });
      }
    },

    onDetach() {
      model.dispose();
    },
  };
}

export { createVesselEntity as createShipEntity };
