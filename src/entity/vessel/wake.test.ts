import { describe, it, expect, vi } from 'vitest';
import { createWakeEntity } from './wake';

describe('createWakeEntity', () => {
  it('creates an entity with id "wake"', () => {
    const entity = createWakeEntity();
    expect(entity.id).toBe('wake');
  });

  it('attaches a mesh to the scene', () => {
    const scene = { add: vi.fn(), createPoints: vi.fn().mockReturnValue({ dispose: vi.fn() }) } as any;
    const entity = createWakeEntity();
    entity.onAttach(scene);
    expect(scene.add).toHaveBeenCalled();
  });

  it('defines lifecycle methods', () => {
    const entity = createWakeEntity();
    expect(typeof entity.onDetach).toBe('function');
  });
});
