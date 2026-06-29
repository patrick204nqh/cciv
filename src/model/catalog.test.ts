import { describe, it, expect, beforeEach } from 'vitest';
import { ModelCatalogReader } from './catalog';

const testManifest = {
  'ship': {
    glb: '/model/definitions/ship.glb',
    polyCount: 168317,
  },
  'buoy': {
    glb: '/model/definitions/buoy.glb',
  },
};

describe('ModelCatalogReader', () => {
  let catalog: ModelCatalogReader;

  beforeEach(() => {
    catalog = new ModelCatalogReader(testManifest);
  });

  it('returns entry for existing ref', () => {
    const entry = catalog.getEntry('ship');
    expect(entry!.glb).toBe('/model/definitions/ship.glb');
    expect(entry!.polyCount).toBe(168317);
  });

  it('returns undefined for unknown ref', () => {
    expect(catalog.getEntry('nonexistent')).toBeUndefined();
  });

  it('checks if ref exists', () => {
    expect(catalog.has('ship')).toBe(true);
    expect(catalog.has('nonexistent')).toBe(false);
  });

  it('returns all entries', () => {
    const all = catalog.getAll();
    expect(all).toHaveLength(2);
  });

  it('allows adding entries dynamically', () => {
    catalog.addEntry('new-model', { glb: '/model/definitions/new.glb' });
    expect(catalog.has('new-model')).toBe(true);
  });
});
