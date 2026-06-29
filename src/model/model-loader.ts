import type { ModelLoader, ModelCatalogEntry } from './types';
import { ModelLoadError } from './types';
import type { ModelEntity, ModelDefinition } from './types';
import type { IScene } from '../graphics/types';
import { SceneObject } from '../graphics/object';
import { GlbLoader } from './glb-loader';
import { ModelCatalogReader } from './catalog';
import { modelRegistry } from './active-registry';
import { Disposer } from '../util/disposer';
import { buildModelFromDefinition } from './model-builder';
import { modelDefinitions } from './definitions/registry';

function buildModelEntity(
  rawRoot: any,
  ref: string,
  metadata: ModelEntity['metadata'],
  onDispose?: () => void,
): ModelEntity {
  const root = new SceneObject(rawRoot);
  const disp = new Disposer();
  disp.add(() => rawRoot.removeFromParent());
  if (onDispose) disp.add(onDispose);

  return {
    id: ref,
    root,
    metadata,
    clone() {
      return buildModelEntity(rawRoot.clone(true), ref, metadata);
    },
    dispose() {
      disp.dispose();
    },
  };
}

export class ModelLoaderImpl implements ModelLoader {
  private cache = new Map<string, ModelEntity>();
  private glbLoader: GlbLoader;
  private catalog: ModelCatalogReader;
  private scene: IScene | null = null;

  constructor(
    glbLoader?: GlbLoader,
    catalog?: ModelCatalogReader,
    scene?: IScene,
  ) {
    this.glbLoader = glbLoader ?? new GlbLoader();
    this.catalog = catalog ?? new ModelCatalogReader();
    this.scene = scene ?? null;
  }

  setScene(scene: IScene): void {
    this.scene = scene;
  }

  setCatalog(catalog: ModelCatalogReader): void {
    this.catalog = catalog;
  }

  async load(ref: string): Promise<ModelEntity> {
    const cached = this.cache.get(ref);
    if (cached) return cached;

    const def = modelDefinitions[ref];
    if (def) {
      const scene = this.scene;
      if (!scene) throw new ModelLoadError(`IScene not set — cannot build model "${ref}"`, ref);
      const entity = buildModelFromDefinition(ref, def, scene);
      modelRegistry.register(entity);
      this.cache.set(ref, entity);
      return entity;
    }

    const entry = this.catalog.getEntry(ref);
    if (!entry) throw new ModelLoadError(`Model not found in catalog: ${ref}`, ref);

    const entity = await this.loadFromEntry(ref, entry);
    this.cache.set(ref, entity);
    return entity;
  }

  private async loadFromEntry(ref: string, entry: ModelCatalogEntry): Promise<ModelEntity> {
    const result = await this.glbLoader.load(entry.glb);
    const rawRoot = result.scene;
    rawRoot.name = ref;

    if (entry.transform) {
      const tf = entry.transform;
      if (tf.scale != null) {
        if (typeof tf.scale === 'number') rawRoot.scale.setScalar(tf.scale);
        else rawRoot.scale.set(tf.scale[0], tf.scale[1], tf.scale[2]);
      }
      if (tf.rotation) rawRoot.rotation.set(tf.rotation[0], tf.rotation[1], tf.rotation[2]);
      if (tf.position) rawRoot.position.set(tf.position[0], tf.position[1], tf.position[2]);
    }

    const metadata = {
      id: ref,
      source: 'code-defined' as const,
      license: entry.license,
      polyCount: entry.polyCount,
    };
    const entity = buildModelEntity(rawRoot, ref, metadata, () => modelRegistry.unregister(ref));
    modelRegistry.register(entity);
    return entity;
  }

  async preload(refs: string[]): Promise<void> {
    await Promise.all(refs.map(ref => this.load(ref)));
  }

  getCached(ref: string): ModelEntity | undefined {
    return this.cache.get(ref);
  }

  clearCache(): void {
    for (const entity of this.cache.values()) entity.dispose();
    this.cache.clear();
  }
}
