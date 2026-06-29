import { bus } from '../util/event-bus';

export const MAX_THRUST = 80000;
export const MAX_STEER_TORQUE = 60000;

class VesselControls {
  private _keys = new Set<string>();
  private _vesselIds = new Set<string>();
  private _activeId: string | null = null;
  private _started = false;
  private _onKeyDown!: (e: KeyboardEvent) => void;
  private _onKeyUp!: (e: KeyboardEvent) => void;

  private _start(): void {
    if (this._started) return;
    this._started = true;

    this._onKeyDown = (e) => {
      this._keys.add(e.key.toLowerCase());

      if (e.key === 'Tab') {
        e.preventDefault();
        this._switchToNext();
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    };

    this._onKeyUp = (e) => {
      this._keys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  private _switchToNext(): void {
    const ids = Array.from(this._vesselIds);
    if (ids.length === 0) return;
    const idx = this._activeId ? ids.indexOf(this._activeId) : -1;
    const next = (idx + 1) % ids.length;
    this._activeId = ids[next];
    bus.emit('vessel:active-changed', this._activeId);
  }

  registerVessel(id: string): void {
    this._start();
    this._vesselIds.add(id);
    if (!this._activeId) {
      this._activeId = id;
      bus.emit('vessel:active-changed', id);
    }
  }

  unregisterVessel(id: string): void {
    this._vesselIds.delete(id);
    if (this._activeId === id) {
      const [next] = this._vesselIds;
      this._activeId = next ?? null;
      if (this._activeId) bus.emit('vessel:active-changed', this._activeId);
    }
  }

  setActive(id: string): void {
    if (!this._vesselIds.has(id) || this._activeId === id) return;
    this._activeId = id;
    bus.emit('vessel:active-changed', id);
  }

  get activeId(): string | null {
    return this._activeId;
  }

  throttle(vesselId: string): number {
    if (this._activeId !== vesselId) return 0;
    let t = 0;
    if (this._keys.has('w') || this._keys.has('arrowup')) t += 1;
    if (this._keys.has('s') || this._keys.has('arrowdown')) t -= 1;
    return t;
  }

  steer(vesselId: string): number {
    if (this._activeId !== vesselId) return 0;
    let s = 0;
    if (this._keys.has('a') || this._keys.has('arrowleft')) s += 1;
    if (this._keys.has('d') || this._keys.has('arrowright')) s -= 1;
    return s;
  }

  dispose(): void {
    if (!this._started) return;
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this._keys.clear();
    this._vesselIds.clear();
    this._activeId = null;
    this._started = false;
  }
}

export const vesselControls = new VesselControls();
