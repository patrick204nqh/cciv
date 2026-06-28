import * as THREE from 'three';
import type { ModelLoader, ModelCatalogEntry } from '../loaders/types';
import { ModelLoadError } from '../loaders/types';
import type { ModelEntity } from './types';
import { SceneObject } from '../scene/object';
import { GlbLoader } from '../loaders/glb-loader';
import { ModelCatalogReader } from '../loaders/catalog';
import { modelRegistry } from './registry';
import { traverseMeshes } from './utils';
import { Disposer } from '../util/disposer';

function buildModelEntity(
  rawRoot: THREE.Group,
  ref: string,
  metadata: ModelEntity['metadata'],
  onDispose?: () => void,
): ModelEntity {
  const root = new SceneObject(rawRoot);
  const disp = new Disposer();
  disp.add(rawRoot);
  if (onDispose) disp.add(onDispose);

  return {
    id: ref,
    root,
    metadata,
    clone() {
      return buildModelEntity(rawRoot.clone(true), ref, metadata);
    },
    applyMaterials(materials) {
      traverseMeshes(root, (mesh, mat) => {
        const override = materials[mesh.name];
        if (!override) return;
        const cloned = mat.clone();
        cloned.color.set(override.color);
        cloned.roughness = override.roughness;
        cloned.metalness = override.metalness;
        cloned.visible = override.visible;
        mesh.material = cloned;
      });
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
    if (!entry) throw new ModelLoadError(`Model not found in catalog: ${ref}`, ref);

    const entity = await this.loadFromEntry(ref, entry);
    this.cache.set(ref, entity);
    return entity;
  }

  private async loadFromEntry(ref: string, entry: ModelCatalogEntry): Promise<ModelEntity> {
    const result = await this.glbLoader.load(entry.glb);
    const rawRoot = result.scene;
    rawRoot.name = ref;

    if (entry.materialOverrides) {
      traverseMeshes(new SceneObject(rawRoot), (_mesh, mat) => {
        const override = entry.materialOverrides![_mesh.name];
        if (!override) return;
        if (override.color != null) mat.color.setHex(override.color);
        if (override.roughness != null) mat.roughness = override.roughness;
        if (override.metalness != null) mat.metalness = override.metalness;
        if (override.transparent != null) mat.transparent = override.transparent;
        if (override.alphaTest != null) mat.alphaTest = override.alphaTest;
      });
    }

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
      source: 'extracted' as const,
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
