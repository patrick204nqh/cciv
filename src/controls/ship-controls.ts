import { activeVessel } from './active-vessel';

export const MAX_THRUST = 80000;
export const MAX_STEER_TORQUE = 60000;

export class ShipControls {
  private keys = new Set<string>();
  private _onKeyDown!: (e: KeyboardEvent) => void;
  private _onKeyUp!: (e: KeyboardEvent) => void;
  private _started = false;
  private _vesselId: string;

  constructor(vesselId: string) {
    this._vesselId = vesselId;
  }

  start(): void {
    if (this._started) return;
    this._started = true;
    this._onKeyDown = (e: KeyboardEvent) => this.keys.add(e.key.toLowerCase());
    this._onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  get isActive(): boolean {
    return activeVessel.activeId === this._vesselId;
  }

  get throttle(): number {
    if (!this.isActive) return 0;
    let t = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) t += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) t -= 1;
    return t;
  }

  get steer(): number {
    if (!this.isActive) return 0;
    let s = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) s += 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) s -= 1;
    return s;
  }

  get maxThrust(): number {
    return MAX_THRUST;
  }

  get maxSteerTorque(): number {
    return MAX_STEER_TORQUE;
  }

  dispose(): void {
    if (this._started) {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
    }
    this.keys.clear();
    this._started = false;
  }
}
