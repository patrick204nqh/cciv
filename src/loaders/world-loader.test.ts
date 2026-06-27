import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorldLoader } from './world-loader';
import type { WorldConfig } from '../state/types';
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

  it('loads a world and creates entities for vessel instances', async () => {
    const world: WorldConfig = {
      environment: { ocean: true, sky: true, lighting: 'day' },
      instances: {
        'my-ship': {
          ref: 'ship',
          transform: { position: [10, 0, 20], rotation: [0, 0, 0], scale: 1.5 },
          visible: true,
          behavior: 'vessel',
        },
      },
    };
    const result = await worldLoader.load(world, mockModelLoader);
    expect(result.entities.length).toBeGreaterThanOrEqual(4);
    const vesselEntity = result.entities.find(e => e.id === 'my-ship');
    expect(vesselEntity).toBeDefined();
    expect(mockModelLoader.load).toHaveBeenCalledWith('ship');
    expect(result.errors).toHaveLength(0);
    expect(result.metadata.loadedAt).toBeGreaterThan(0);
  });

  it('loads a world with only static instances', async () => {
    const world: WorldConfig = {
      environment: { ocean: false, sky: false },
      instances: {
        'buoy-1': {
          ref: 'buoy',
          transform: { position: [50, 0, 30], rotation: [0, 0, 0], scale: 1 },
          visible: true,
        },
      },
    };
    const result = await worldLoader.load(world, mockModelLoader);
    expect(result.entities).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('collects errors for failed model loads', async () => {
    mockModelLoader.load.mockRejectedValue(new Error('Network error'));
    const world: WorldConfig = {
      environment: { ocean: false, sky: false },
      instances: {
        'my-ship': {
          ref: 'ship',
          transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 },
          visible: true,
          behavior: 'vessel',
        },
      },
    };
    const result = await worldLoader.load(world, mockModelLoader);
    expect(result.entities).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].ref).toBe('ship');
    expect(result.errors[0].error.message).toBe('Network error');
  });

  it('loads multiple vessels', async () => {
    mockModelLoader.load
      .mockResolvedValueOnce(mockModelEntity)
      .mockResolvedValueOnce({ ...mockModelEntity, id: 'buoy' });
    const world: WorldConfig = {
      environment: { ocean: true, sky: true },
      instances: {
        ship: {
          ref: 'ship',
          transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
          visible: true,
          behavior: 'vessel',
        },
        'buoy-1': {
          ref: 'buoy',
          transform: { position: [60, 0, 35], rotation: [0, 0, 0], scale: 1 },
          visible: true,
          behavior: 'vessel',
        },
      },
    };
    const result = await worldLoader.load(world, mockModelLoader);
    const vessels = result.entities.filter(e => e.id === 'ship' || e.id === 'buoy-1');
    expect(vessels).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });
});
