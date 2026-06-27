import { describe, it, expect, vi, beforeEach } from 'vitest';

// THREE.CanvasTexture calls document.createElement at module scope
const mockCanvas = { width: 32, height: 32, getContext: () => ({
  createRadialGradient: () => ({ addColorStop: vi.fn() }),
  fillStyle: '', fillRect: vi.fn(),
}) } as any;
vi.stubGlobal('document', { createElement: () => mockCanvas });

import { createSprayEntity } from './spray-entity';

describe('createSprayEntity', () => {
  it('creates an entity with id "spray"', () => {
    const entity = createSprayEntity();
    expect(entity.id).toBe('spray');
  });

  it('attaches a points system to the scene', () => {
    const scene = { add: vi.fn() } as any;
    const entity = createSprayEntity();
    entity.onAttach(scene);
    expect(scene.add).toHaveBeenCalled();
  });

  it('defines onUpdate and onDetach', () => {
    const entity = createSprayEntity();
    expect(typeof entity.onUpdate).toBe('function');
    expect(typeof entity.onDetach).toBe('function');
  });
});
