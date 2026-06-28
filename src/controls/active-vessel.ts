import { bus } from '../event-bus';

class ActiveVessel {
  private vesselIds = new Set<string>();
  private _activeId: string | null = null;
  private _initialized = false;

  get activeId(): string | null {
    return this._activeId;
  }

  register(id: string): void {
    this.vesselIds.add(id);
    if (!this._activeId) {
      this._activeId = id;
      bus.emit('vessel:active-changed', id);
    }
    if (!this._initialized && this.vesselIds.size >= 1) {
      this._initialized = true;
      window.addEventListener('keydown', this._onKey);
    }
  }

  unregister(id: string): void {
    this.vesselIds.delete(id);
    if (this._activeId === id) {
      const next = this.vesselIds.values().next().value;
      this._activeId = next ?? null;
      if (this._activeId) bus.emit('vessel:active-changed', this._activeId);
    }
    if (this.vesselIds.size === 0 && this._initialized) {
      this._initialized = false;
      window.removeEventListener('keydown', this._onKey);
    }
  }

  setActive(id: string): void {
    if (!this.vesselIds.has(id) || this._activeId === id) return;
    this._activeId = id;
    bus.emit('vessel:active-changed', id);
  }

  private _onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ids = Array.from(this.vesselIds);
      if (ids.length === 0) return;
      const idx = this._activeId ? ids.indexOf(this._activeId) : -1;
      const next = (idx + 1) % ids.length;
      this._activeId = ids[next];
      bus.emit('vessel:active-changed', this._activeId);
    }
  };
}

export const activeVessel = new ActiveVessel();
