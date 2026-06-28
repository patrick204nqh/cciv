import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorldLoader } from './world-loader';
import type { WorldConfig, EnvironmentState } from '../state/types';
import type { ModelEntity } from '../model/types';

function testEnv(gates?: { ocean?: boolean; sky?: boolean; lighting?: boolean }): EnvironmentState {
  const g = gates ?? {};
  return {
    waves: [{ speed: 1, amplitude: 1, frequency: 0.1, steepness: 0.3 }],
    fog: { type: 'exp2', color: '#000000', density: 0 },
    ...(g.ocean ? { ocean: { color: '#000000', opacity: 0.8, gridSize: 80, extent: 1800 } } : {}),
    ...(g.sky ? { sky: { gradientTop: '#000000', gradientBottom: '#000000', horizonOffset: 0 } } : {}),
    ...(g.lighting
      ? {
          lighting: {
            sun: { enabled: true, intensity: 1, color: '#ffffff', azimuth: 0, elevation: 1 },
            hemisphere: { enabled: true, skyColor: '#ffffff', groundColor: '#000000', intensity: 0.5 },
            fill: { enabled: false, intensity: 0, color: '#000000' },
            pointLights: [] as { enabled: boolean; intensity: number; color: string; position: [number, number, number]; range: number }[],
          },
        }
      : {}),
  };
}

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
      environment: testEnv({ ocean: true, sky: true, lighting: true }),
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
      environment: testEnv(),
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
      environment: testEnv(),
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
      environment: testEnv({ ocean: true, sky: true }),
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
