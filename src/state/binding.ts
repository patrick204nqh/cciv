import type { StateStore } from './store';
import type { Disposer } from '../util/disposer';

export class EntityStateBinding<T> {
  private unsubscribe?: () => void;

  constructor(
    private store: StateStore,
    private path: string,
    private onUpdate: (value: T) => void
  ) {}

  attach(disposer: Disposer): void {
    this.unsubscribe = this.store.subscribe(this.path, (v) => {
      this.onUpdate(v as T);
    });
    disposer.add(() => this.detach());
  }

  detach(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }
}
