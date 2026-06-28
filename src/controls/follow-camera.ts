import * as THREE from 'three';
import { bus } from '../event-bus';
import { activeVessel } from './active-vessel';
import type { OrbitControls } from '../three/addons';

export class FollowCamera {
  private controls: OrbitControls | null = null;
  private _enabled = false;
  private vesselPos = new THREE.Vector3();
  private _unsubPosition: (() => void) | null = null;

  init(controls: OrbitControls): void {
    this.controls = controls;
    this._unsubPosition = bus.on('entity:position-changed', (ev) => {
      if (ev.entityId === activeVessel.activeId) {
        this.vesselPos.set(ev.x, ev.y, ev.z);
      }
    });
  }

  enable(): void {
    if (!this._enabled && this.controls) {
      this.controls.autoRotate = false;
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
    this.controls.target.copy(this.vesselPos);
  }

  dispose(): void {
    this._unsubPosition?.();
    this.controls = null;
  }
}
