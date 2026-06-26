import * as THREE from 'three';
import {
  type ModelConfig,
  type ModelEntity,
  type MeshGroupSpec,
} from './types';
import { modelRegistry } from './registry';
import { materialRegistry, type MaterialSpec } from '../material';
import { Disposer } from '../util/disposer';

function buildGeometry(spec: MeshGroupSpec): THREE.BufferGeometry {
  if (spec.type === 'extracted') {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(spec.pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(spec.nml, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(spec.uv, 2));
    if (spec.uv2) g.setAttribute('uv2', new THREE.BufferAttribute(spec.uv2, 2));
    g.setIndex(new THREE.BufferAttribute(spec.indices, 1));
    return g;
  }
  if (spec.type === 'procedural') return spec.build();
  throw new Error(`Unknown mesh group type: ${(spec as any).type}`);
}

function applyTransform(root: THREE.Group, tf: ModelConfig['transform']): void {
  if (!tf) return;
  if (tf.scale != null) {
    if (typeof tf.scale === 'number') root.scale.setScalar(tf.scale);
    else root.scale.set(tf.scale[0], tf.scale[1], tf.scale[2]);
  }
  if (tf.rotation) root.rotation.set(tf.rotation[0], tf.rotation[1], tf.rotation[2]);
  if (tf.position) root.position.set(tf.position[0], tf.position[1], tf.position[2]);
}

export function createModel(config: ModelConfig): ModelEntity {
  const root = new THREE.Group();
  root.name = config.id;
  const disp = new Disposer();

  for (const spec of config.meshGroups) {
    const geo = buildGeometry(spec);
    const override: Partial<MaterialSpec> = config.materialOverrides?.[spec.name] ?? {};
    const matSpec: MaterialSpec = { textureKey: spec.textureKey, ...override };
    const mat = materialRegistry.getOrCreate(matSpec);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = spec.name;
    root.add(mesh);
    disp.addGeo(geo);
    disp.addMat(mat);
    disp.addObj(mesh);
  }

  applyTransform(root, config.transform);
  disp.addObj(root);
  disp.addCleanup(() => modelRegistry.unregister(config.id));

  const entity: ModelEntity = {
    id: config.id,
    root,
    metadata: {
      id: config.id,
      source: config.source,
      license: config.metadata?.license,
      sourceUrl: config.metadata?.sourceUrl,
      polyCount: config.metadata?.polyCount,
    },
    dispose() {
      disp.dispose();
    },
  };

  return entity;
}
