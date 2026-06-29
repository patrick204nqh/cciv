import type { IGeometryFactory, IMaterialFactory, GeometryHandle, IMaterial } from '../graphics/types';

export interface BuildResult {
  geometry: GeometryHandle;
  material: IMaterial;
  polyCount: number;
}

export interface ModelGroupPlugin {
  readonly type: string;
  build(
    config: Record<string, unknown>,
    geoFactory: IGeometryFactory,
    matFactory: IMaterialFactory,
  ): BuildResult;
}

export class ModelGroupRegistry {
  private plugins = new Map<string, ModelGroupPlugin>();

  register(plugin: ModelGroupPlugin): void {
    if (this.plugins.has(plugin.type)) {
      throw new Error(`Model group plugin '${plugin.type}' is already registered`);
    }
    this.plugins.set(plugin.type, plugin);
  }

  build(
    type: string,
    config: Record<string, unknown>,
    geoFactory: IGeometryFactory,
    matFactory: IMaterialFactory,
  ): BuildResult {
    const plugin = this.plugins.get(type);
    if (!plugin) {
      throw new Error(`Unknown model group type '${type}' — no plugin registered`);
    }
    return plugin.build(config, geoFactory, matFactory);
  }

  has(type: string): boolean {
    return this.plugins.has(type);
  }
}
