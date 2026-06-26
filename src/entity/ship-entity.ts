import * as THREE from 'three';
import type { SceneEntity } from './types';
import { bus } from '../event-bus';
import { type ModelEntity } from '../model/types';
import { sampleOcean, sampleNormal } from '../environment/waves';
import { worldClock } from '../time';

const WAVE_SPEED = 0.42;

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
      const t = worldClock.elapsed * WAVE_SPEED;
      const pos = new THREE.Vector3();
      model.root.getWorldPosition(pos);

      const { height: waveY } = sampleOcean(pos.x, pos.z, t);
      const n = sampleNormal(pos.x, pos.z, t);

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
          position: newPos,
          quaternion: newQuat,
        });
      }
    },

    onDetach() {
      model.dispose();
    },
  };
}
