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
    for (const entity of this.models.values()) {
      entity.dispose();
    }
    this.models.clear();
  }
}

export const modelRegistry = new ModelRegistry();
