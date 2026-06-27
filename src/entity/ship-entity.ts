import * as THREE from 'three';
import type { SceneEntity } from './types';
import { bus } from '../event-bus';
import type { ModelEntity } from '../model/types';
import { waveSurface } from '../environment/wave-surface';
import type { Disposer } from '../util/disposer';

export function createVesselEntity(model: ModelEntity, vesselId?: string): SceneEntity {
  const id = vesselId ?? 'vessel';
  let prevPos = new THREE.Vector3();
  let prevQuat = new THREE.Quaternion();

  return {
    id,

    onAttach(scene: THREE.Scene, disposer?: Disposer) {
      scene.add(model.root);
      disposer?.add(model.root);
    },

    onBeforeUpdate(_dt: number) {
      model.root.getWorldPosition(prevPos);
      model.root.getWorldQuaternion(prevQuat);
    },

    onUpdate(dt: number) {
      const pos = new THREE.Vector3();
      model.root.getWorldPosition(pos);

      const { height: waveY, normal: n } = waveSurface.sample(pos.x, pos.z);

      const targetY = -1.5 + waveY;
      const targetRx = Math.atan2(n.z, n.y) * 0.5;
      const targetRz = -Math.atan2(n.x, n.y) * 0.5;

      const sy = Math.min(dt * 2.5, 1);
      const sr = Math.min(dt * 2, 1);

      model.root.position.y += (targetY - model.root.position.y) * sy;
      model.root.rotation.x += (targetRx - model.root.rotation.x) * sr;
      model.root.rotation.z += (targetRz - model.root.rotation.z) * sr;

      const newPos = new THREE.Vector3();
      const newQuat = new THREE.Quaternion();
      model.root.getWorldPosition(newPos);
      model.root.getWorldQuaternion(newQuat);

      if (!newPos.equals(prevPos) || !newQuat.equals(prevQuat)) {
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
