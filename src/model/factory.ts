import * as THREE from 'three';
import { loadTextureSet } from '../textures';
import {
  type ModelConfig,
  type ModelEntity,
  type MeshGroupSpec,
} from './types';
import { modelRegistry } from './registry';

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
  throw new Error(`External mesh groups not yet supported: ${spec.name}`);
}

function buildMaterial(textureKey: string | undefined, overrides: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  const tex = textureKey ? loadTextureSet(textureKey) : {};
  return new THREE.MeshStandardMaterial({
    map: tex.map,
    normalMap: tex.normalMap,
    roughnessMap: tex.roughnessMap,
    metalnessMap: tex.metalnessMap,
    alphaMap: tex.alphaMap,
    aoMap: tex.aoMap,
    roughness: 0.88,
    metalness: 0.02,
    ...overrides,
  });
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

  const meshes: THREE.Mesh[] = [];

  for (const spec of config.meshGroups) {
    const geo = buildGeometry(spec);
    const mat = buildMaterial(spec.textureKey, config.materialOverrides?.[spec.name]);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = spec.name;
    root.add(mesh);
    meshes.push(mesh);
  }

  applyTransform(root, config.transform);

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
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
        else mesh.material.dispose();
      }
      root.removeFromParent();
      modelRegistry.unregister(config.id);
    },
  };

  modelRegistry.register(entity);
  return entity;
}
