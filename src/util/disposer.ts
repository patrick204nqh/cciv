import type { ISceneObject } from '../scene/types';

export type Disposable = ISceneObject | (() => void);

export class Disposer {
  private items: Disposable[] = [];

  add(item: Disposable): void {
    this.items.push(item);
  }

  dispose(): void {
    for (const item of this.items) {
      if (typeof item === 'function') item();
      else item.dispose();
    }
    this.items.length = 0;
  }
}
