import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorldLoader } from './world-loader';
import type { WorldConfig } from '../worlds/types';
import type { ModelEntity } from '../model/types';

describe('WorldLoader', () => {
  let worldLoader: WorldLoader;
  let mockModelLoader: any;
  let mockModelEntity: ModelEntity;

  beforeEach(() => {
    mockModelEntity = {
      id: 'ship',
      root: {
        name: 'ship',
        position: { set: vi.fn() },
        scale: { setScalar: vi.fn() },
        rotation: { set: vi.fn() },
        quaternion: { set: vi.fn() },
      } as any,
      metadata: { id: 'ship', source: 'procedural' },
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

  it('loads a world and returns model entries', async () => {
    const world: WorldConfig = {
      id: 'test-world',
      models: [{ ref: 'ship', position: [10, 0, 20], scale: 1.5 }],
      environment: { ocean: true, sky: true, lighting: 'day' },
    };
    const result = await worldLoader.load(world, mockModelLoader);
    expect(result.config.id).toBe('test-world');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].model).toBe(mockModelEntity);
    expect(mockModelLoader.load).toHaveBeenCalledWith('ship');
  });

  it('returns instance transform data', async () => {
    const world: WorldConfig = {
      id: 'test-world',
      models: [{ ref: 'ship', position: [10, 0, 20], scale: 2 }],
      environment: {},
    };
    const result = await worldLoader.load(world, mockModelLoader);
    expect(result.entries[0].instance.position).toEqual([10, 0, 20]);
    expect(result.entries[0].instance.scale).toBe(2);
  });

  it('loads multiple models', async () => {
    const world: WorldConfig = {
      id: 'test-world',
      models: [{ ref: 'ship', position: [0, 0, 0] }, { ref: 'buoy', position: [50, 0, 30] }],
      environment: {},
    };
    mockModelLoader.load
      .mockResolvedValueOnce(mockModelEntity)
      .mockResolvedValueOnce({ ...mockModelEntity, id: 'buoy' });
    const result = await worldLoader.load(world, mockModelLoader);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[1].model.id).toBe('buoy');
  });
});
