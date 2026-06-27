import type { AssetProvider } from './types';

export class ProviderRegistry {
  private providers = new Map<string, AssetProvider>();

  register(provider: AssetProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): AssetProvider {
    const p = this.providers.get(id);
    if (!p) throw new Error(`Provider not found: ${id}`);
    return p;
  }

  has(id: string): boolean {
    return this.providers.has(id);
  }

  getAll(): AssetProvider[] {
    return Array.from(this.providers.values());
  }
}
