import { describe, it, expect, vi } from 'vitest';
import { createOceanEntity } from './ocean';
import type { OceanConfig } from '../../graphics/types';

const testConfig: OceanConfig = {
  color: '#2090d0',
  waves: [],
  fft: {
    cascadeSize: [256, 128],
    windSpeed: 10,
    windDirection: [1, 0],
    fetch: 50000,
    peakEnhancement: 3.3,
  },
  clipmap: {
    rings: [
      { segments: 32, radius: 50 },
      { segments: 32, radius: 150 },
      { segments: 16, radius: 400 },
      { segments: 8, radius: 1500 },
    ],
    overlap: 2,
  },
};

describe('createOceanEntity', () => {
  it('creates an entity with id "ocean"', () => {
    const entity = createOceanEntity(testConfig);
    expect(entity.id).toBe('ocean');
  });

  it('creates water via scene gate', () => {
    const waterObj = { dispose: vi.fn() };
    const scene = {
      add: vi.fn(),
      createWater: vi.fn().mockReturnValue({ object: waterObj, dispose: vi.fn() }),
    } as any;
    const entity = createOceanEntity(testConfig);
    entity.onAttach(scene);
    expect(scene.createWater).toHaveBeenCalled();
    expect(scene.add).toHaveBeenCalledWith(waterObj);
  });

  it('defines onUpdate and onDetach', () => {
    const entity = createOceanEntity(testConfig);
    expect(typeof entity.onUpdate).toBe('function');
    expect(typeof entity.onDetach).toBe('function');
  });
});
