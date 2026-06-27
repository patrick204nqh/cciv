import { describe, it, expect, beforeEach } from 'vitest';
import { ModelCatalogReader } from './catalog';

const testManifest = {
  'ship': {
    glb: '/models/ship.glb',
    provider: 'polyhaven',
    polyCount: 168317,
  },
  'buoy': {
    glb: '/models/buoy.glb',
    provider: 'procedural',
  },
};

describe('ModelCatalogReader', () => {
  let catalog: ModelCatalogReader;

  beforeEach(() => {
    catalog = new ModelCatalogReader(testManifest);
  });

  it('returns entry for existing ref', () => {
    const entry = catalog.getEntry('ship');
    expect(entry!.glb).toBe('/models/ship.glb');
    expect(entry!.provider).toBe('polyhaven');
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
    catalog.addEntry('new-model', { glb: '/models/new.glb' });
    expect(catalog.has('new-model')).toBe(true);
  });
});
