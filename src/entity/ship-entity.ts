import * as THREE from 'three';
import type { SceneEntity } from './types';
import { bus } from '../event-bus';
import { type ModelEntity } from '../model/types';
import { waveSurface } from '../environment/wave-surface';

export function createShipEntity(model: ModelEntity): SceneEntity {
  let prevPos = new THREE.Vector3();
  let prevQuat = new THREE.Quaternion();

  return {
    id: 'ship',

    onAttach(scene: THREE.Scene) {
      scene.add(model.root);
    },

    onBeforeUpdate(_dt: number) {
      model.root.getWorldPosition(prevPos);
      model.root.getWorldQuaternion(prevQuat);
    },

    onUpdate(_dt: number) {
      const pos = new THREE.Vector3();
      model.root.getWorldPosition(pos);

      const { height: waveY, normal: n } = waveSurface.sample(pos.x, pos.z);

      model.root.position.y = -1.5 + waveY;
      model.root.rotation.x = Math.atan2(n.z, n.y) * 0.5;
      model.root.rotation.z = -Math.atan2(n.x, n.y) * 0.5;

      const newPos = new THREE.Vector3();
      const newQuat = new THREE.Quaternion();
      model.root.getWorldPosition(newPos);
      model.root.getWorldQuaternion(newQuat);

      if (!newPos.equals(prevPos) || !newQuat.equals(prevQuat)) {
        bus.emit('entity:position-changed', {
          entityId: 'ship',
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
