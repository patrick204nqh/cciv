import { describe, it, expect, vi } from 'vitest';
import { createOceanEntity } from './ocean';

vi.mock('../../environment/tsl-ocean', () => ({
  createTSLOceanMaterial: vi.fn().mockReturnValue({ dispose: vi.fn() }),
}));

function makeWaves() {
  return [
    { dir: [0.7, 0.7], k: 0.157, omega: 1.24, amp: 1.4, Qi: 0.51, phase: 0, speed: 1 },
  ] as any;
}

describe('createOceanEntity', () => {
  it('creates an entity with id "ocean"', () => {
    const entity = createOceanEntity(makeWaves());
    expect(entity.id).toBe('ocean');
  });

  it('attaches a mesh to the scene', () => {
    const scene = {
      add: vi.fn(),
      createMesh: vi.fn(),
      createPlaneGeometry: vi.fn().mockReturnValue({ rotateX: vi.fn() }),
    } as any;
    const entity = createOceanEntity(makeWaves());
    entity.onAttach(scene);
    expect(scene.add).toHaveBeenCalled();
  });

  it('defines onUpdate and onDetach', () => {
    const entity = createOceanEntity(makeWaves());
    expect(typeof entity.onUpdate).toBe('function');
    expect(typeof entity.onDetach).toBe('function');
  });
});
