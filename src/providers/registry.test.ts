import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRegistry } from './registry';
import type { AssetProvider, AssetBundle } from './types';

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;
  let mockProvider: AssetProvider;

  beforeEach(() => {
    registry = new ProviderRegistry();
    mockProvider = {
      id: 'test-provider',
      async pull(_assetId: string, _destDir: string): Promise<AssetBundle> {
        return { id: _assetId, meshes: [], texturePaths: {}, metadata: {} };
      },
    };
  });

  it('registers and retrieves a provider', () => {
    registry.register(mockProvider);
    expect(registry.get('test-provider')).toBe(mockProvider);
  });

  it('returns false for unregistered provider', () => {
    expect(registry.has('nonexistent')).toBe(false);
  });

  it('returns true for registered provider', () => {
    registry.register(mockProvider);
    expect(registry.has('test-provider')).toBe(true);
  });

  it('returns all registered providers', () => {
    registry.register(mockProvider);
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.getAll()[0].id).toBe('test-provider');
  });

  it('throws when getting unregistered provider', () => {
    expect(() => registry.get('nonexistent')).toThrow('Provider not found: nonexistent');
  });
});
