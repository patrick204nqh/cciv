import * as THREE from 'three';
import type { ModelLoader, ModelCatalogEntry } from './types';
import type { ModelEntity } from '../model/types';
import { GlbLoader, type GlbLoaderResult } from './glb-loader';
import { ModelCatalogReader } from './catalog';
import { modelRegistry } from '../model/registry';
import { Disposer } from '../util/disposer';

export class ModelLoaderImpl implements ModelLoader {
  private cache = new Map<string, ModelEntity>();
  private glbLoader: GlbLoader;
  private catalog: ModelCatalogReader;

  constructor(
    glbLoader?: GlbLoader,
    catalog?: ModelCatalogReader,
  ) {
    this.glbLoader = glbLoader ?? new GlbLoader();
    this.catalog = catalog ?? new ModelCatalogReader();
  }

  setCatalog(catalog: ModelCatalogReader): void {
    this.catalog = catalog;
  }

  async load(ref: string): Promise<ModelEntity> {
    const cached = this.cache.get(ref);
    if (cached) return cached;

    const entry = this.catalog.getEntry(ref);
    if (!entry) throw new Error(`Model not found in catalog: ${ref}`);

    const entity = await this.loadFromEntry(ref, entry);
    this.cache.set(ref, entity);
    return entity;
  }

  private async loadFromEntry(ref: string, entry: ModelCatalogEntry): Promise<ModelEntity> {
    const result = await this.glbLoader.load(entry.glb);
    const root = result.scene;
    root.name = ref;

    const disp = new Disposer();
    disp.addObj(root);

    if (entry.materialOverrides) {
      root.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const override = entry.materialOverrides![child.name];
          if (override && child.material instanceof THREE.MeshStandardMaterial) {
            if (override.color != null) child.material.color.setHex(override.color);
            if (override.roughness != null) child.material.roughness = override.roughness;
            if (override.metalness != null) child.material.metalness = override.metalness;
            if (override.transparent != null) child.material.transparent = override.transparent;
            if (override.alphaTest != null) child.material.alphaTest = override.alphaTest;
          }
        }
      });
    }

    if (entry.transform) {
      const tf = entry.transform;
      if (tf.scale != null) {
        if (typeof tf.scale === 'number') root.scale.setScalar(tf.scale);
        else root.scale.set(tf.scale[0], tf.scale[1], tf.scale[2]);
      }
      if (tf.rotation) root.rotation.set(tf.rotation[0], tf.rotation[1], tf.rotation[2]);
      if (tf.position) root.position.set(tf.position[0], tf.position[1], tf.position[2]);
    }

    disp.addCleanup(() => modelRegistry.unregister(ref));

    const entity: ModelEntity = {
      id: ref,
      root,
      metadata: {
        id: ref,
        source: 'extracted',
        license: entry.license,
        polyCount: entry.polyCount,
      },
      dispose() {
        disp.dispose();
      },
    };

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
