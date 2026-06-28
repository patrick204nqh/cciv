import * as THREE from 'three';
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
  private vesselPos = new THREE.Vector3();
  private vesselQuat = new THREE.Quaternion();
  private targetPos = new THREE.Vector3();
  private _unsubPosition: (() => void) | null = null;

  init(controls: OrbitControls): void {
    this.controls = controls;
    this._unsubPosition = bus.on('entity:position-changed', (ev) => {
      if (ev.entityId === activeVessel.activeId) {
        this.vesselPos.set(ev.x, ev.y, ev.z);
        this.vesselQuat.set(ev.qx, ev.qy, ev.qz, ev.qw);

        if (!this._enabled) {
          this.targetPos.copy(this.vesselPos);
        }
      }
    });
  }

  enable(): void {
    if (!this._enabled && this.controls) {
      this.controls.autoRotate = false;
      this.targetPos.copy(this.vesselPos);
    }
    this._enabled = true;
  }

  disable(): void {
    if (this._enabled && this.controls) {
      this.controls.autoRotate = true;
    }
    this._enabled = false;
  }

  update(): void {
    if (!this._enabled || !this.controls || !activeVessel.activeId) return;

    const behind = new THREE.Vector3(0, 2, OFFSET_BEHIND);
    behind.applyQuaternion(this.vesselQuat);
    const offsetTarget = this.vesselPos.clone().add(behind);

    this.targetPos.lerp(offsetTarget, FOLLOW_LERP);
    this.controls.target.copy(this.targetPos);

    const dist = this.controls.object.position.distanceTo(this.targetPos);
    if (dist < MIN_DIST || dist > MAX_DIST) {
      const dir = new THREE.Vector3().copy(this.controls.object.position).sub(this.targetPos).normalize();
      const clampedDist = THREE.MathUtils.clamp(dist, MIN_DIST, MAX_DIST);
      this.controls.object.position.copy(this.targetPos).add(dir.multiplyScalar(clampedDist));
    }
  }

  dispose(): void {
    this._unsubPosition?.();
    this.controls = null;
  }
}
