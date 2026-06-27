export interface EntityPositionEvent {
  entityId: string;
  x: number; y: number; z: number;
  qx: number; qy: number; qz: number; qw: number;
}

type EventMap = {
  'entity:attached': string;
  'entity:detached': string;
  'entity:position-changed': EntityPositionEvent;
};

type Listener<T> = (data: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener<any>>>();

  on<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => this.listeners.get(event)?.delete(fn);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    this.listeners.get(event)?.forEach(fn => fn(data));
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const bus = new EventBus();
