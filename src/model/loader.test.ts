import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelLoaderImpl } from './loader';
import type { ModelCatalogEntry } from '../model/types';

describe('ModelLoaderImpl', () => {
  let loader: ModelLoaderImpl;
  let mockGlbResult: { scene: any; animations: any[]; meshes: any[] };

  beforeEach(() => {
    const mockGroup = {
      name: 'test', children: [], add: vi.fn(),
      traverse: vi.fn(),
      position: { set: vi.fn() },
      scale: { setScalar: vi.fn(), set: vi.fn() },
      rotation: { set: vi.fn() },
      removeFromParent: vi.fn(),
      uuid: 'mock-uuid',
    };
    mockGlbResult = { scene: mockGroup, animations: [], meshes: [] };

    const mockGlbLoader = {
      load: vi.fn().mockResolvedValue(mockGlbResult),
      setDracoDecoderPath: vi.fn(),
      dispose: vi.fn(),
    };

    const mockCatalog = {
      getEntry: vi.fn().mockImplementation((ref: string) => {
        if (ref === 'glb-model') return { glb: '/model/definitions/glb-model.glb' } as ModelCatalogEntry;
        return undefined;
      }),
      has: vi.fn().mockImplementation((ref: string) => ref === 'glb-model'),
      getAll: vi.fn().mockReturnValue([{ id: 'glb-model', entry: { glb: '/model/definitions/glb-model.glb' } }]),
    };

    loader = new ModelLoaderImpl(mockGlbLoader as any, mockCatalog as any);
  });

  it('loads a code-defined model by ref', async () => {
    const entity = await loader.load('ship');
    expect(entity.id).toBe('ship');
    expect(entity.metadata.source).toBe('procedural');
  });

  it('loads a GLB model by ref as fallback', async () => {
    const entity = await loader.load('glb-model');
    expect(entity.id).toBe('glb-model');
    expect(entity.root.id).toBe(mockGlbResult.scene.uuid);
  });

  it('throws for unknown ref', async () => {
    await expect(loader.load('nonexistent')).rejects.toThrow('Model not found in catalog');
  });

  it('caches loaded models', async () => {
    const first = await loader.load('ship');
    const second = await loader.load('ship');
    expect(first).toBe(second);
  });

  it('returns undefined for uncached model', () => {
    expect(loader.getCached('ship')).toBeUndefined();
  });

  it('returns cached model after load', async () => {
    await loader.load('ship');
    expect(loader.getCached('ship')).toBeDefined();
  });

  it('preloads multiple models', async () => {
    await loader.preload(['ship']);
    expect(loader.getCached('ship')).toBeDefined();
  });

  it('clears cache', async () => {
    await loader.load('ship');
    loader.clearCache();
    expect(loader.getCached('ship')).toBeUndefined();
  });
});
