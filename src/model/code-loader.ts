import type { ModelEntity, ModelDefinition, GroupDefinition, DataGroup } from './types';
import { SceneObject } from '../graphics/object';
import * as THREE from 'three';

function toF32(a: number[]): Float32Array {
  return a instanceof Float32Array ? a : new Float32Array(a);
}

function toIdx(a: number[]): Uint16Array | Uint32Array {
  let max = 0;
  for (let i = 0; i < a.length; i++) if (a[i] > max) max = a[i];
  if (max > 65535) return new Uint32Array(a);
  return new Uint16Array(a);
}

function makeMaterial(spec?: Partial<import('./types').MaterialSpec>): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial();
  if (!spec) return mat;
  if (spec.color != null) mat.color.setHex(spec.color);
  if (spec.roughness != null) mat.roughness = spec.roughness;
  if (spec.metalness != null) mat.metalness = spec.metalness;
  if (spec.transparent) { mat.transparent = true; }
  if (spec.alphaTest != null) mat.alphaTest = spec.alphaTest;
  return mat;
}

function buildDataGeometry(def: DataGroup): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(toF32(def.positions), 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(toF32(def.normals), 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(toF32(def.uvs), 2));
  if (def.uvs2) geo.setAttribute('uv2', new THREE.Float32BufferAttribute(toF32(def.uvs2), 2));
  geo.setIndex(new THREE.BufferAttribute(toIdx(def.indices), 1));
  geo.userData._materialSpec = def.material;
  return geo;
}

function buildGroupGeometry(def: GroupDefinition): THREE.BufferGeometry {
  return buildDataGeometry(def);
}

export function buildModelFromDefinition(id: string, def: ModelDefinition): ModelEntity {
  const group = new THREE.Group();
  group.name = id;

  for (const [groupName, groupDef] of Object.entries(def.groups)) {
    const geometry = buildGroupGeometry(groupDef);
    const matSpec = geometry.userData._materialSpec as (Partial<import('./types').MaterialSpec> | undefined);
    delete geometry.userData._materialSpec;
    const mesh = new THREE.Mesh(geometry, makeMaterial(matSpec));
    mesh.name = groupName;
    mesh.matrixAutoUpdate = true;
    group.add(mesh);
  }

  if (def.transform) {
    const tf = def.transform;
    if (tf.scale != null) {
      if (typeof tf.scale === 'number') group.scale.setScalar(tf.scale);
      else group.scale.set(tf.scale[0], tf.scale[1], tf.scale[2]);
    }
    if (tf.rotation) group.rotation.set(tf.rotation[0], tf.rotation[1], tf.rotation[2]);
    if (tf.position) group.position.set(tf.position[0], tf.position[1], tf.position[2]);
  }

  const root = new SceneObject(group);
  let polyCount = 0;
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const idx = child.geometry.index;
      if (idx) polyCount += idx.count / 3;
    }
  });

  return {
    id,
    root,
    metadata: {
      id,
      source: 'procedural',
      license: def.metadata?.license,
      sourceUrl: def.metadata?.sourceUrl,
      polyCount,
    },
    dispose() {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      group.removeFromParent();
    },
    clone() {
      return buildModelFromDefinition(id, def);
    },
  };
}
