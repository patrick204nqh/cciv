import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorldLoader } from './world-loader';
import type { WorldConfig } from '../worlds/types';
import type { ModelEntity } from '../model/types';

describe('WorldLoader', () => {
  let worldLoader: WorldLoader;
  let mockScene: any;
  let mockModelLoader: any;
  let mockModelEntity: ModelEntity;

  beforeEach(() => {
    mockScene = { add: vi.fn() };
    mockModelEntity = {
      id: 'ship',
      root: {
        name: 'ship',
        position: { set: vi.fn() },
        scale: { setScalar: vi.fn() },
        rotation: { set: vi.fn() },
        quaternion: { set: vi.fn() },
      } as any,
      metadata: { id: 'ship', source: 'external' as any },
      dispose: vi.fn(),
    };
    mockModelLoader = {
      load: vi.fn().mockResolvedValue(mockModelEntity),
      preload: vi.fn().mockResolvedValue(undefined),
      getCached: vi.fn().mockReturnValue(undefined),
      clearCache: vi.fn(),
    };
    worldLoader = new WorldLoader();
  });

  it('loads a world and returns entities', async () => {
    const world: WorldConfig = {
      id: 'test-world',
      models: [{ ref: 'ship', at: [10, 0, 20], scale: 1.5 }],
      environment: { ocean: true, sky: true, lighting: 'day' },
    };
    const result = await worldLoader.load(world, mockScene, mockModelLoader);
    expect(result.config.id).toBe('test-world');
    expect(result.entities.length).toBe(1);
    expect(mockModelLoader.load).toHaveBeenCalledWith('ship');
  });

  it('applies transform from model instance', async () => {
    const world: WorldConfig = {
      id: 'test-world',
      models: [{ ref: 'ship', at: [10, 0, 20], scale: 2 }],
      environment: {},
    };
    await worldLoader.load(world, mockScene, mockModelLoader);
    expect(mockModelEntity.root.position.set).toHaveBeenCalledWith(10, 0, 20);
    expect(mockModelEntity.root.scale.setScalar).toHaveBeenCalledWith(2);
  });

  it('loads multiple models', async () => {
    const world: WorldConfig = {
      id: 'test-world',
      models: [{ ref: 'ship', at: [0, 0, 0] }, { ref: 'buoy', at: [50, 0, 30] }],
      environment: {},
    };
    mockModelLoader.load
      .mockResolvedValueOnce(mockModelEntity)
      .mockResolvedValueOnce(mockModelEntity);
    const result = await worldLoader.load(world, mockScene, mockModelLoader);
    expect(result.entities.length).toBe(2);
  });
});
