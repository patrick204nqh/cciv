import type { SceneEntity } from './types';
import type { IScene } from '../scene/types';
import { Disposer } from '../util/disposer';
import { bus } from '../event-bus';

export class EntityManager {
  private entities = new Set<SceneEntity>();
  private disposers = new Map<string, Disposer>();
  private _paused = false;

  get paused(): boolean {
    return this._paused;
  }

  setPaused(paused: boolean): void {
    this._paused = paused;
  }

  attach(entity: SceneEntity, scene: IScene): void {
    this.entities.add(entity);
    const disp = new Disposer();
    this.disposers.set(entity.id, disp);
    entity.onAttach(scene, disp);
    bus.emit('entity:attached', entity.id);
  }

  detach(entity: SceneEntity): void {
    entity.onDetach();
    const disp = this.disposers.get(entity.id);
    if (disp) {
      disp.dispose();
      this.disposers.delete(entity.id);
    }
    this.entities.delete(entity);
    bus.emit('entity:detached', entity.id);
  }

  detachAll(): void {
    for (const entity of this.entities) {
      entity.onDetach();
      const disp = this.disposers.get(entity.id);
      if (disp) {
        disp.dispose();
        this.disposers.delete(entity.id);
      }
    }
    this.entities.clear();
  }

  getEntities(): SceneEntity[] {
    return Array.from(this.entities);
  }

  update(dt: number): void {
    if (this._paused) return;
    for (const entity of this.entities) entity.onBeforeUpdate?.(dt);
    for (const entity of this.entities) entity.onUpdate?.(dt);
  }
}

export const entityManager = new EntityManager();
