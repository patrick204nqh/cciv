import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createShipEntity } from './ship';
import type { ModelEntity } from '../../model/types';
import type { SceneHandle } from '../types';
import type { ISceneObject } from '../../scene/types';

vi.mock('../../environment/wave-surface', () => ({
  waveSurface: {
    sample: vi.fn().mockReturnValue({ height: 1, dispX: 0, dispZ: 0, normal: { x: 0, y: 1, z: 0 } }),
  },
}));

function createMockSceneObject(overrides?: Partial<ISceneObject>): ISceneObject {
  const pos = { x: 0, y: 0, z: 0 };
  const rot = { x: 0, y: 0, z: 0 };
  const scl = { x: 1, y: 1, z: 1 };

  const geo = new THREE.BufferGeometry();
  const verts = new Float32Array(9);
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 1, 2]), 1));

  const hullMesh = new THREE.Mesh(geo);
  hullMesh.name = 'hull';
  hullMesh.updateWorldMatrix = vi.fn() as any;

  const rootGroup = new THREE.Group();
  rootGroup.add(hullMesh);
  rootGroup.updateWorldMatrix = vi.fn() as any;

  return {
    object3D: rootGroup,
    position: pos,
    rotation: rot,
    scale: scl,
    visible: true,
    worldPosition: { x: 0, y: 0, z: 0 },
    worldQuaternion: { x: 0, y: 0, z: 0, w: 1 },
    forward: { x: 0, y: 0, z: -1 },
    right: { x: 1, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    parent: null,
    children: [],
    addChild: vi.fn(),
    removeChild: vi.fn(),
    detach: vi.fn(),
    findChild: vi.fn(),
    traverse: vi.fn(),
    traverseAncestors: vi.fn(),
    traverseMeshes: vi.fn(),
    clone: vi.fn(),
    dispose: vi.fn(),
    ...overrides,
  };
}

describe('createShipEntity', () => {
  let model: ModelEntity;
  let scene: SceneHandle;

  beforeEach(() => {
    scene = { add: vi.fn(), remove: vi.fn() };
    model = {
      id: 'ship',
      root: createMockSceneObject(),
      metadata: { id: 'ship', source: 'extracted' },
      clone: vi.fn() as any,
      dispose: vi.fn(),
      applyMaterials: vi.fn(),
    };
  });

  it('creates an entity with the given vessel id', () => {
    const entity = createShipEntity(model, 'my-vessel');
    expect(entity.id).toBe('my-vessel');
  });

  it('adds model root to scene on attach', () => {
    const entity = createShipEntity(model);
    entity.onAttach(scene);
    expect(scene.add).toHaveBeenCalledWith(model.root);
  });

  it('disposes model on detach', () => {
    const entity = createShipEntity(model);
    entity.onDetach();
    expect(model.dispose).toHaveBeenCalled();
  });
});
