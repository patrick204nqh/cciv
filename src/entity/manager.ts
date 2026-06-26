import * as THREE from 'three';
import type { SceneEntity } from './types';
import { bus } from '../event-bus';
import { worldClock } from '../time';

class EntityManager {
  private entities = new Set<SceneEntity>();

  attach(entity: SceneEntity, scene: THREE.Scene): void {
    this.entities.add(entity);
    entity.onAttach(scene);
    bus.emit('entity:attached', entity.id);
  }

  detach(entity: SceneEntity): void {
    entity.onDetach();
    this.entities.delete(entity);
    bus.emit('entity:detached', entity.id);
  }

  detachAll(): void {
    for (const entity of this.entities) entity.onDetach();
    this.entities.clear();
  }

  getEntities(): SceneEntity[] {
    return Array.from(this.entities);
  }

  update(dt: number): void {
    worldClock.update(dt);
    for (const entity of this.entities) entity.onBeforeUpdate(dt);
    for (const entity of this.entities) entity.onUpdate(dt);
  }
}

export const entityManager = new EntityManager();
