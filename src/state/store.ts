import { createStore } from 'zustand/vanilla';
import type { AppState } from './types';

type Listener = (value: unknown, path: string) => void;

function getByPath(obj: any, path: string): unknown {
  const parts = path.split('.');
  let cur = obj;
  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in cur) {
      cur = cur[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

function setByPath(obj: any, path: string, value: unknown): void {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

export class StateStore {
  private store: ReturnType<typeof createStore<AppState>>;
  private pathListeners = new Map<string, Set<Listener>>();

  constructor(initial: AppState) {
    this.store = createStore(() => structuredClone(initial));
  }

  get(): AppState;
  get<K extends keyof AppState>(path: K): AppState[K];
  get(path?: string): unknown {
    const state = this.store.getState();
    if (!path) return state;
    return getByPath(state, path);
  }

  set(path: string, value: unknown): void {
    this.store.setState(state => {
      const next = structuredClone(state);
      setByPath(next, path, value);
      return next;
    });
    this.notify(path, value);
  }

  select<T>(selector: (state: AppState) => T): T {
    return selector(this.store.getState());
  }

  watch<T>(selector: (state: AppState) => T, fn: (value: T) => void): () => void {
    let prev = selector(this.store.getState());
    const unsub = this.store.subscribe(state => {
      const next = selector(state);
      if (next !== prev) {
        prev = next;
        fn(next);
      }
    });
    return unsub;
  }

  subscribe(path: string, fn: Listener): () => void {
    if (!this.pathListeners.has(path)) {
      this.pathListeners.set(path, new Set());
    }
    this.pathListeners.get(path)!.add(fn);
    return () => { this.pathListeners.get(path)?.delete(fn); };
  }

  snapshot(): AppState {
    return structuredClone(this.store.getState());
  }

  restore(snapshot: AppState): void {
    this.store.setState(snapshot, true);
    const keys = Object.keys(snapshot);
    for (const key of keys) {
      const v = (snapshot as Record<string, unknown>)[key];
      this.notify(key, v);
    }
  }

  private notify(path: string, value: unknown): void {
    for (const [key, fns] of this.pathListeners) {
      const match = key === '' || path === key || path.startsWith(key + '.') || key.startsWith(path + '.');
      if (match) {
        const v = key === path ? value : this.get(key);
        for (const fn of fns) fn(v, path);
      }
    }
  }
}
