import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createShipEntity } from './ship-entity';
import type { ModelEntity } from '../model/types';

vi.mock('../environment/wave-surface', () => ({
  waveSurface: {
    sample: vi.fn().mockReturnValue({ height: 1, dispX: 0, dispZ: 0, normal: { x: 0, y: 1, z: 0 } }),
  },
}));

describe('createShipEntity', () => {
  let model: ModelEntity;

  beforeEach(() => {
    model = {
      id: 'ship',
      root: {
        name: 'ship', position: { y: 0 }, rotation: { x: 0, z: 0 },
        getWorldPosition: vi.fn((v: any) => { v.x = 0; v.y = 0; v.z = 0; }),
        getWorldQuaternion: vi.fn((q: any) => { q.x = 0; q.y = 0; q.z = 0; q.w = 1; }),
      } as any,
      metadata: { id: 'ship', source: 'extracted' },
      dispose: vi.fn(),
    };
  });

  it('creates an entity with id "ship"', () => {
    const entity = createShipEntity(model);
    expect(entity.id).toBe('ship');
  });

  it('adds model root to scene on attach', () => {
    const scene = { add: vi.fn() } as any;
    const entity = createShipEntity(model);
    entity.onAttach(scene);
    expect(scene.add).toHaveBeenCalledWith(model.root);
  });

  it('calls waveSurface.sample on update', async () => {
    const { waveSurface } = await import('../environment/wave-surface');
    const entity = createShipEntity(model);
    entity.onUpdate(0.016);
    expect(waveSurface.sample).toHaveBeenCalled();
  });

  it('disposes model on detach', () => {
    const entity = createShipEntity(model);
    entity.onDetach();
    expect(model.dispose).toHaveBeenCalled();
  });
});
