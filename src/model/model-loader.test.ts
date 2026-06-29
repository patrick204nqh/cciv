import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelLoaderImpl } from './model-loader';
import type { ModelCatalogEntry } from '../model/types';
import type { IScene, ISceneObject } from '../graphics/types';
import { GeometryHandle, FRONT_SIDE } from '../graphics/types';

function createMockScene(): IScene {
  const meshes: ISceneObject[] = [];
  const groups: ISceneObject[] = [];

  function makeObj(name: string, isMesh: boolean): ISceneObject {
    const children: ISceneObject[] = [];
    return {
      id: `mock-${name}-${Math.random()}`,
      name,
      type: isMesh ? 'Mesh' : 'Group',
      userData: {},
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visible: true,
      worldPosition: { x: 0, y: 0, z: 0 },
      worldQuaternion: { x: 0, y: 0, z: 0, w: 1 },
      forward: { x: 0, y: 0, z: -1 },
      right: { x: 1, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      parent: null,
      children,
      addChild(c: ISceneObject) { children.push(c); return this; },
      removeChild(c: ISceneObject) { const i = children.indexOf(c); if (i >= 0) children.splice(i, 1); return this; },
      detach() { return this; },
      findChild() { return null; },
      traverse(fn) { fn(this); children.forEach(c => c.traverse(fn)); return this; },
      traverseAncestors() { return this; },
      traverseMeshes(fn) { if (isMesh) fn(this); children.forEach(c => c.traverseMeshes(fn)); return this; },
      updateWorldMatrix() {},
      clone() { return makeObj(name, isMesh); },
      dispose() {},
      getWorldMatrix() { return new Float32Array(16); },
      getGeometryData() { return null; },
      [Symbol.toStringTag]: 'ISceneObject',
    } as ISceneObject;
  }

  return {
    fog: null,
    background: null,
    environment: null,
    add() {},
    remove() {},
    getObjectByName() { return undefined; },
    traverse() {},
    createGroup(name?: string) {
      const g = makeObj(name ?? 'group', false);
      groups.push(g);
      return g;
    },
    createMesh() {
      const m = makeObj('mesh', true);
      meshes.push(m);
      return m;
    },
    createDirectionalLight() { return makeObj('light', false); },
    createPointLight() { return makeObj('pointLight', false); },
    createAmbientLight() { return makeObj('ambient', false); },
    createHemisphereLight() { return makeObj('hemi', false); },
    createPlaneGeometry() { return new GeometryHandle(); },
    createSphereGeometry() { return new GeometryHandle(); },
    createPoints() { return makeObj('points', false); },
    createBufferGeometry() { return new GeometryHandle(); },
    setAttribute() {},
    setIndex() {},
    markAttributeDirty() {},
    readAttribute() { return null; },
    wrapObject3D(obj: any) { const o = makeObj(obj.name ?? 'wrapped', false); o.id = obj.uuid; return o; },
    createCanvasTexture(c: HTMLCanvasElement) { return c; },
    registerMaterial() {},
    createStandardMaterial(spec: any) {
      return {
        color: spec?.color,
        roughness: spec?.roughness ?? 1,
        metalness: spec?.metalness ?? 0,
        opacity: 1,
        transparent: spec?.transparent ?? false,
        side: FRONT_SIDE,
        dispose() {},
      };
    },
    createWater() { return { object: makeObj('water', true), dispose() {} }; },
    createSky() { return makeObj('sky', false); },
    flushEnvironment() {},
    [Symbol.toStringTag]: 'IScene',
  } as IScene;
}

describe('ModelLoaderImpl', () => {
  let loader: ModelLoaderImpl;
  let mockGlbResult: { scene: any; animations: any[]; meshes: any[] };

  beforeEach(() => {
    const mockGroup = {
      name: 'test', children: [], add: vi.fn(),
      traverse: vi.fn(),
      position: { set: vi.fn() },
      scale: { setScalar: vi.fn(), set: vi.fn() },
      rotation: { set: vi.fn() },
      removeFromParent: vi.fn(),
      uuid: 'mock-uuid',
    };
    mockGlbResult = { scene: mockGroup, animations: [], meshes: [] };

    const mockGlbLoader = {
      load: vi.fn().mockResolvedValue(mockGlbResult),
      setDracoDecoderPath: vi.fn(),
      dispose: vi.fn(),
    };

    const mockCatalog = {
      getEntry: vi.fn().mockImplementation((ref: string) => {
        if (ref === 'glb-model') return { glb: '/model/definitions/glb-model.glb' } as ModelCatalogEntry;
        return undefined;
      }),
      has: vi.fn().mockImplementation((ref: string) => ref === 'glb-model'),
      getAll: vi.fn().mockReturnValue([{ id: 'glb-model', entry: { glb: '/model/definitions/glb-model.glb' } }]),
    };

    loader = new ModelLoaderImpl(mockGlbLoader as any, mockCatalog as any, createMockScene());
  });

  it('loads a code-defined model by ref', async () => {
    const entity = await loader.load('ship');
    expect(entity.id).toBe('ship');
    expect(entity.metadata.source).toBe('code-defined');
  });

  it('loads a GLB model by ref as fallback', async () => {
    const entity = await loader.load('glb-model');
    expect(entity.id).toBe('glb-model');
    expect(entity.root.id).toBe(mockGlbResult.scene.uuid);
  });

  it('throws for unknown ref', async () => {
    await expect(loader.load('nonexistent')).rejects.toThrow('Model not found in catalog');
  });

  it('caches loaded models', async () => {
    const first = await loader.load('ship');
    const second = await loader.load('ship');
    expect(first).toBe(second);
  });

  it('returns undefined for uncached model', () => {
    expect(loader.getCached('ship')).toBeUndefined();
  });

  it('returns cached model after load', async () => {
    await loader.load('ship');
    expect(loader.getCached('ship')).toBeDefined();
  });

  it('preloads multiple models', async () => {
    await loader.preload(['ship']);
    expect(loader.getCached('ship')).toBeDefined();
  });

  it('clears cache', async () => {
    await loader.load('ship');
    loader.clearCache();
    expect(loader.getCached('ship')).toBeUndefined();
  });
});
