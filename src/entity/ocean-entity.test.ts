import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOceanEntity } from './ocean-entity';

vi.mock('../environment/water-textures', () => ({
  createWaterNormalMap: () => ({ dispose: vi.fn() }),
  createWaterDiffuseMap: () => ({ dispose: vi.fn() }),
}));

describe('createOceanEntity', () => {
  it('creates an entity with id "ocean"', () => {
    const entity = createOceanEntity();
    expect(entity.id).toBe('ocean');
  });

  it('attaches a mesh to the scene', () => {
    const scene = { add: vi.fn() } as any;
    const entity = createOceanEntity();
    entity.onAttach(scene);
    expect(scene.add).toHaveBeenCalled();
  });

  it('defines onUpdate and onDetach', () => {
    const entity = createOceanEntity();
    expect(typeof entity.onUpdate).toBe('function');
    expect(typeof entity.onDetach).toBe('function');
  });
});
