import type { ModelCatalog, ModelCatalogEntry } from './types';

export class ModelCatalogReader {
  private entries: Map<string, ModelCatalogEntry>;

  constructor(manifest: ModelCatalog = {}) {
    this.entries = new Map(Object.entries(manifest));
  }

  getEntry(ref: string): ModelCatalogEntry | undefined {
    return this.entries.get(ref);
  }

  has(ref: string): boolean {
    return this.entries.has(ref);
  }

  getAll(): Array<{ id: string; entry: ModelCatalogEntry }> {
    return Array.from(this.entries.entries()).map(([id, entry]) => ({ id, entry }));
  }

  addEntry(id: string, entry: ModelCatalogEntry): void {
    this.entries.set(id, entry);
  }

  toJSON(): ModelCatalog {
    return Object.fromEntries(this.entries);
  }
}
