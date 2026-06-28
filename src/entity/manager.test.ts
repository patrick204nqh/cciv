import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityManager } from './manager';
import type { SceneEntity } from './types';
import type { IScene } from '../scene/types';

describe('EntityManager', () => {
  let manager: EntityManager;
  let mockScene: IScene;
  let entity: SceneEntity;

  beforeEach(() => {
    manager = new EntityManager();
    mockScene = {
      add: vi.fn(),
      remove: vi.fn(),
      fog: null,
      background: null,
      getObjectByName: vi.fn(),
      traverse: vi.fn(),
    };
    entity = {
      id: 'test',
      onAttach: vi.fn(),
      onUpdate: vi.fn(),
      onDetach: vi.fn(),
    };
  });

  it('attaches an entity and provides a SceneHandle + Disposer', () => {
    manager.attach(entity, mockScene);
    expect(entity.onAttach).toHaveBeenCalled();
    expect(entity.onAttach).toHaveBeenCalledWith(mockScene, expect.anything());
  });

  it('detaches an entity and disposes resources', () => {
    manager.attach(entity, mockScene);
    manager.detach(entity);
    expect(entity.onDetach).toHaveBeenCalled();
  });

  it('calls onUpdate for all entities', () => {
    manager.attach(entity, mockScene);
    manager.update(0.016);
    expect(entity.onUpdate).toHaveBeenCalledWith(0.016);
  });

  it('calls onBeforeUpdate if defined', () => {
    const withBefore = { ...entity, onBeforeUpdate: vi.fn() };
    manager.attach(withBefore, mockScene);
    manager.update(0.016);
    expect(withBefore.onBeforeUpdate).toHaveBeenCalledWith(0.016);
  });

  it('does not call onUpdate when paused', () => {
    manager.attach(entity, mockScene);
    manager.setPaused(true);
    manager.update(0.016);
    expect(entity.onUpdate).not.toHaveBeenCalled();
  });

  it('resumes updates after unpausing', () => {
    manager.attach(entity, mockScene);
    manager.setPaused(true);
    manager.update(0.016);
    manager.setPaused(false);
    manager.update(0.016);
    expect(entity.onUpdate).toHaveBeenCalledTimes(1);
  });

  it('detaches all entities', () => {
    manager.attach(entity, mockScene);
    manager.detachAll();
    expect(entity.onDetach).toHaveBeenCalled();
    expect(manager.getEntities()).toHaveLength(0);
  });
});
