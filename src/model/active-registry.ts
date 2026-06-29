import type { ModelEntity } from './types';

class ModelRegistry {
  private models = new Map<string, ModelEntity>();

  register(entity: ModelEntity): void {
    this.models.set(entity.id, entity);
  }

  unregister(id: string): void {
    this.models.delete(id);
  }

  get(id: string): ModelEntity | undefined {
    return this.models.get(id);
  }

  getAll(): ModelEntity[] {
    return Array.from(this.models.values());
  }

  disposeAll(): void {
    const all = Array.from(this.models.values());
    for (const entity of all) entity.dispose();
    this.models.clear();
  }
}

export const modelRegistry = new ModelRegistry();
