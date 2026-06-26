export class WorldClock {
  elapsed = 0;
  timeScale = 1;
  paused = false;

  update(dt: number): void {
    if (!this.paused) {
      this.elapsed += dt * this.timeScale;
    }
  }

  reset(): void {
    this.elapsed = 0;
  }
}

export const worldClock = new WorldClock();
