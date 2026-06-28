import type { AppState } from './types';

type Listener = (value: unknown, path: string) => void;

export class StateStore {
  private state: AppState;
  private listeners = new Map<string, Set<Listener>>();
  private watchers: Set<() => void> = new Set();

  constructor(initial: AppState) {
    this.state = structuredClone(initial);
  }

  get(): AppState;
  get<K extends keyof AppState>(path: K): AppState[K];
  get(path?: string): unknown {
    if (!path) return this.state;
    const parts = path.split('.');
    let cur: unknown = this.state;
    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return cur;
  }

  set(path: string, value: unknown): void {
    const parts = path.split('.');
    let cur: unknown = this.state;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur && typeof cur === 'object') {
        cur = (cur as Record<string, unknown>)[parts[i]];
      }
    }
    if (cur && typeof cur === 'object') {
      (cur as Record<string, unknown>)[parts[parts.length - 1]] = value;
    }
    this.notify(path, value);
    this.fireWatchers();

  }

  /** Typed read accessor. Returns the result of the selector function. */
  select<T>(selector: (state: AppState) => T): T {
    return selector(this.state);
  }

  /** Typed subscription — fires whenever any state changes. */
  watch<T>(selector: (state: AppState) => T, fn: (value: T) => void): () => void {
    const wrapper = () => fn(selector(this.state));
    this.watchers.add(wrapper);
    return () => { this.watchers.delete(wrapper); };
  }

  subscribe(path: string, fn: Listener): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path)!.add(fn);
    return () => { this.listeners.get(path)?.delete(fn); };
  }

  snapshot(): AppState {
    return structuredClone(this.state);
  }

  restore(snapshot: AppState): void {
    const oldKeys = Object.keys(this.state);
    this.state = snapshot;
    for (const key of oldKeys) {
      const v = (this.state as Record<string, unknown>)[key];
      this.notify(key, v);
    }
    this.fireWatchers();
  }

  private fireWatchers(): void {
    for (const fn of this.watchers) fn();
  }

  private notify(path: string, value: unknown): void {
    for (const [key, fns] of this.listeners) {
      // If the listener key is for the root (empty string), notify for any path
      if (key === '') {
        const v = this.get(key); // Get the entire state for root listener
        for (const fn of fns) fn(v, path);
      } else if (path === key || path.startsWith(key + '.') || key.startsWith(path + '.')) {
        const v = key === path ? value : this.get(key);
        for (const fn of fns) fn(v, path);
      }
    }
  }
}
