import { bus } from '../event-bus';
import { activeVessel } from './active-vessel';
import type { OrbitControls } from '../three/addons';

const FOLLOW_LERP = 0.06;
const OFFSET_BEHIND = 15;
const MIN_DIST = 20;
const MAX_DIST = 120;

export class FollowCamera {
  private controls: OrbitControls | null = null;
  private _enabled = false;
  private vesselPos = { x: 0, y: 0, z: 0 };
  private vesselQuat = { x: 0, y: 0, z: 0, w: 1 };
  private targetPos = { x: 0, y: 0, z: 0 };
  private _unsubPosition: (() => void) | null = null;

  init(controls: OrbitControls): void {
    this.controls = controls;
    this._unsubPosition = bus.on('entity:position-changed', (ev) => {
      if (ev.entityId === activeVessel.activeId) {
        this.vesselPos = { x: ev.x, y: ev.y, z: ev.z };
        this.vesselQuat = { x: ev.qx, y: ev.qy, z: ev.qz, w: ev.qw };

        if (!this._enabled) {
          this.targetPos = { x: this.vesselPos.x, y: this.vesselPos.y, z: this.vesselPos.z };
        }
      }
    });
  }

  enable(): void {
    if (!this._enabled && this.controls) {
      this.controls.autoRotate = false;
      this.targetPos = { x: this.vesselPos.x, y: this.vesselPos.y, z: this.vesselPos.z };
    }
    this._enabled = true;
  }

  disable(): void {
    this._enabled = false;
  }

  update(): void {
    if (!this._enabled || !this.controls) return;

    this.targetPos.x += (this.vesselPos.x - this.targetPos.x) * FOLLOW_LERP;
    this.targetPos.y += (this.vesselPos.y - this.targetPos.y) * FOLLOW_LERP;
    this.targetPos.z += (this.vesselPos.z - this.targetPos.z) * FOLLOW_LERP;

    this.controls.target.set(this.targetPos.x, this.targetPos.y, this.targetPos.z);
    this.controls.update();
  }

  dispose(): void {
    this._unsubPosition?.();
    this._unsubPosition = null;
  }
}
