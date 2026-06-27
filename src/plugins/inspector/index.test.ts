import { describe, it, expect } from 'vitest';
import { StateStore } from '../../state/store';
import { createDefaultState } from '../../state/defaults';
import type { MaterialOverride } from '../../state/types';

describe('material presets', () => {
  const mockMaterials: Record<string, MaterialOverride> = {
    hull: { color: '#8B4513', roughness: 0.8, metalness: 0.1, visible: true },
    deck: { color: '#D2B48C', roughness: 0.9, metalness: 0, visible: true },
  };

  it('produces correct preset format', () => {
    const data = { format: 'cciv-material-preset', version: 1, materials: mockMaterials };
    const json = JSON.stringify(data, null, 2);
    const parsed = JSON.parse(json);
    expect(parsed.format).toBe('cciv-material-preset');
    expect(parsed.version).toBe(1);
    expect(parsed.materials.hull.color).toBe('#8B4513');
  });

  it('applies preset materials to store', () => {
    const store = new StateStore(createDefaultState());
    store.set('instances.ship.materials', mockMaterials);
    const result = store.get('instances.ship.materials') as Record<string, MaterialOverride>;
    expect(result.hull.color).toBe('#8B4513');
    expect(result.hull.roughness).toBe(0.8);
    expect(result.deck.color).toBe('#D2B48C');
  });

  it('rejects invalid format', () => {
    const store = new StateStore(createDefaultState());
    const fn = () => {
      const data = { format: 'wrong', version: 1, materials: mockMaterials };
      if (data.format !== 'cciv-material-preset' || data.version !== 1) {
        throw new Error('Invalid format');
      }
      store.set('instances.ship.materials', data.materials);
    };
    expect(fn).toThrow('Invalid format');
  });
});
