export class WorldClock {
  private _elapsed = 0;
  private _timeScale = 1;
  private _paused = false;

  get elapsed(): number { return this._elapsed; }
  get timeScale(): number { return this._timeScale; }
  get paused(): boolean { return this._paused; }

  setTimeScale(n: number): void { this._timeScale = n; }
  pause(): void { this._paused = true; }
  resume(): void { this._paused = false; }

  update(dt: number): void {
    if (!this._paused) {
      this._elapsed += dt * this._timeScale;
    }
  }

  reset(): void {
    this._elapsed = 0;
  }
}

export const worldClock = new WorldClock();
