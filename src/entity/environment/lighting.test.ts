import { describe, it, expect, vi } from 'vitest';
import { createLightingEntity } from './lighting';

describe('createLightingEntity', () => {
  it('creates an entity with id "lighting"', () => {
    const entity = createLightingEntity();
    expect(entity.id).toBe('lighting');
  });

  it('adds lights to the scene', () => {
    const scene = {
      add: vi.fn(),
      createDirectionalLight: vi.fn().mockReturnValue({ position: {}, dispose: vi.fn() }),
      createHemisphereLight: vi.fn().mockReturnValue({ position: {}, dispose: vi.fn() }),
      createAmbientLight: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    } as any;
    const entity = createLightingEntity();
    entity.onAttach(scene);
    expect(scene.add).toHaveBeenCalled();
  });

  it('defines lifecycle methods', () => {
    const entity = createLightingEntity();
    expect(typeof entity.onDetach).toBe('function');
  });
});
