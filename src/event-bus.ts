export interface EntityPositionEvent {
  entityId: string;
  x: number; y: number; z: number;
  qx: number; qy: number; qz: number; qw: number;
  vx: number; vy: number; vz: number;
}

type EventMap = {
  'entity:attached': string;
  'entity:detached': string;
  'entity:position-changed': EntityPositionEvent;
  'vessel:active-changed': string;
};

type Listener<T> = (data: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener<any>>>();

  on<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => this.listeners.get(event)?.delete(fn);
  }

  /** Returns true if at least one listener was called. */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): boolean {
    const fns = this.listeners.get(event);
    if (!fns || fns.size === 0) return false;
    for (const fn of fns) fn(data);
    return true;
  }
}

export const bus = new EventBus();
