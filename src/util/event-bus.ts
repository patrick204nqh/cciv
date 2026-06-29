import mitt from 'mitt';

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

const emitter = mitt<EventMap>();

export const bus = {
  on<K extends keyof EventMap>(event: K, fn: (data: EventMap[K]) => void): () => void {
    emitter.on(event, fn as any);
    return () => emitter.off(event, fn as any);
  },
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): boolean {
    emitter.emit(event, data);
    return true;
  },
};
