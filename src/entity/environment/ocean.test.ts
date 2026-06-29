import { describe, it, expect, vi } from 'vitest';
import { createOceanEntity } from './ocean';

describe('createOceanEntity', () => {
  it('creates an entity with id "ocean"', () => {
    const entity = createOceanEntity(100, 10);
    expect(entity.id).toBe('ocean');
  });

  it('creates water via scene gate', () => {
    const waterObj = { dispose: vi.fn() };
    const scene = {
      add: vi.fn(),
      createPlaneGeometry: vi.fn().mockReturnValue({} as any),
      createWater: vi.fn().mockReturnValue({ object: waterObj, dispose: vi.fn() }),
    } as any;
    const entity = createOceanEntity(100, 10, { color: '#2090d0' });
    entity.onAttach(scene);
    expect(scene.createWater).toHaveBeenCalled();
    expect(scene.add).toHaveBeenCalledWith(waterObj);
  });

  it('defines onUpdate and onDetach', () => {
    const entity = createOceanEntity(100, 10);
    expect(typeof entity.onUpdate).toBe('function');
    expect(typeof entity.onDetach).toBe('function');
  });
});
