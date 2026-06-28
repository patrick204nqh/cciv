import type { StateStore } from '../state/store';
import type { AppState } from '../state/types';

export interface PluginStateAPI {
  get(): AppState;
  get<K extends keyof AppState>(path: K): AppState[K];
  set(path: string, value: unknown): void;
  select<T>(selector: (state: AppState) => T): T;
  watch<T>(selector: (state: AppState) => T, fn: (value: T) => void): () => void;
  subscribe(path: string, fn: (value: unknown, path: string) => void): () => void;
}

export function createPluginStateAPI(store: StateStore): PluginStateAPI {
  return {
    get(path?: any) {
      return path ? store.get(path) : store.get();
    },
    set(path: string, value: unknown) {
      store.set(path, value);
    },
    select<T>(selector: (state: AppState) => T): T {
      return store.select(selector);
    },
    watch<T>(selector: (state: AppState) => T, fn: (value: T) => void) {
      return store.watch(selector, fn);
    },
    subscribe(path: string, fn: (value: unknown, path: string) => void) {
      return store.subscribe(path, fn);
    },
  };
}
