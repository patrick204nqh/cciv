import type { StateStore } from './store';

export class LocationTracker {
  private unsubscribe?: () => void;

  constructor(private store: StateStore) {}

  start(): void {
    this.unsubscribe = this.store.subscribe('', (_, path) => {
      if (
        path === 'instances' ||
        path.startsWith('instances.') ||
        path.startsWith('locations.')
      ) {
        this.markDirty();
      }
    });
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  private markDirty(): void {
    const active = this.store.get('activeLocation');
    const dirty = this.store.get('dirtyLocations') as string[];
    if (!dirty.includes(active)) {
      this.store.set('dirtyLocations', [...dirty, active]);
    }
  }
}
