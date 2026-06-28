import * as THREE from 'three';
import { bus } from '../event-bus';
import type { Disposer } from '../util/disposer';

export class PositionTracker {
  private unsubscribe?: () => void;

  constructor(private targetId: string) {}

  track(
    onUpdate: (position: THREE.Vector3, quaternion: THREE.Quaternion) => void,
    disposer: Disposer
  ): void {
    this.unsubscribe = bus.on('entity:position-changed', (ev) => {
      if (ev.entityId === this.targetId) {
        const pos = new THREE.Vector3(ev.x, ev.y, ev.z);
        const quat = new THREE.Quaternion(ev.qx, ev.qy, ev.qz, ev.qw);
        onUpdate(pos, quat);
      }
    });
    disposer.add(() => this.detach());
  }

  detach(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }
}
