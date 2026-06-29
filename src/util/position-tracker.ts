import type { Vec3Like, QuatLike } from '../graphics/types';
import { bus } from '../util/event-bus';
import type { Disposer } from '../util/disposer';

export class PositionTracker {
  private unsubscribe?: () => void;

  constructor(private targetId: string) {}

  track(
    onUpdate: (position: Vec3Like, quaternion: QuatLike) => void,
    disposer: Disposer
  ): void {
    this.unsubscribe = bus.on('entity:position-changed', (ev) => {
      if (ev.entityId === this.targetId) {
        const pos: Vec3Like = { x: ev.x, y: ev.y, z: ev.z };
        const quat: QuatLike = { x: ev.qx, y: ev.qy, z: ev.qz, w: ev.qw };
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
