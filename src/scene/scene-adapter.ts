import * as THREE from 'three';
import type { IScene, ISceneObject, SceneHandle, FogSpec, IMaterial } from './types';
import { SceneObject } from './object';

export class SceneAdapter implements IScene {
  private idCache = new Map<string, ISceneObject>();
  private vendorCache = new Map<THREE.Object3D, string>();

  constructor(private scene: THREE.Scene) {}

  private wrap(obj: THREE.Object3D): ISceneObject {
    const id = obj.uuid;
    const existing = this.idCache.get(id);
    if (existing) return existing;
    const wrapper = new SceneObject(obj);
    this.idCache.set(id, wrapper);
    this.vendorCache.set(obj, id);
    return wrapper;
  }

  add(child: ISceneObject): void {
    const vendor: THREE.Object3D = (child as any)._obj;
    if (!vendor) return;
    this.scene.add(vendor);
    this.idCache.set(child.id, child);
    this.vendorCache.set(vendor, child.id);
  }

  remove(child: ISceneObject): void {
    const vendor: THREE.Object3D = (child as any)._obj;
    if (!vendor) return;
    this.scene.remove(vendor);
    this.idCache.delete(child.id);
    this.vendorCache.delete(vendor);
  }

  createMesh(geometry: THREE.BufferGeometry, material: IMaterial): ISceneObject {
    const vendorMat = (material as any)._vendor;
    const mesh = new THREE.Mesh(geometry, vendorMat);
    return this.wrap(mesh);
  }

  createDirectionalLight(color: string, intensity: number): ISceneObject {
    const light = new THREE.DirectionalLight(new THREE.Color(color), intensity);
    light.castShadow = true;
    light.shadow.mapSize.set(3072, 3072);
    light.shadow.radius = 4;
    const sc = light.shadow.camera;
    sc.left = sc.bottom = -120;
    sc.right = sc.top = 120;
    sc.near = 0.5;
    sc.far = 400;
    return this.wrap(light);
  }

  createAmbientLight(color: string, intensity: number): ISceneObject {
    return this.wrap(new THREE.AmbientLight(new THREE.Color(color), intensity));
  }

  createHemisphereLight(skyColor: string, groundColor: string, intensity: number): ISceneObject {
    return this.wrap(new THREE.HemisphereLight(new THREE.Color(skyColor), new THREE.Color(groundColor), intensity));
  }

  createPlaneGeometry(width: number, height: number, segW: number, segH: number): THREE.BufferGeometry {
    const geo = new THREE.PlaneGeometry(width, height, segW, segH);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  createSphereGeometry(radius: number, widthSeg: number, heightSeg: number): THREE.BufferGeometry {
    return new THREE.SphereGeometry(radius, widthSeg, heightSeg);
  }

  createPoints(geometry: THREE.BufferGeometry, material: IMaterial): ISceneObject {
    const vendorMat = (material as any)._vendor;
    const points = new THREE.Points(geometry, vendorMat);
    return this.wrap(points);
  }

  createBufferGeometry(): THREE.BufferGeometry {
    return new THREE.BufferGeometry();
  }

  setAttribute(geo: THREE.BufferGeometry, name: string, data: Float32Array, itemSize: number): void {
    geo.setAttribute(name, new THREE.BufferAttribute(data, itemSize));
  }

  setIndex(geo: THREE.BufferGeometry, data: Uint16Array): void {
    geo.setIndex(new THREE.BufferAttribute(data, 1));
  }

  markAttributeDirty(geo: THREE.BufferGeometry, name: string): void {
    const attr = geo.attributes[name];
    if (attr) attr.needsUpdate = true;
  }

  get fog(): FogSpec | null {
    const f = this.scene.fog;
    if (!f) return null;
    if (f instanceof THREE.FogExp2) {
      return { type: 'exp2', color: f.color.getHexString(), density: f.density };
    }
    if (f instanceof THREE.Fog) {
      return { type: 'linear', color: f.color.getHexString(), near: f.near, far: f.far };
    }
    return null;
  }

  set fog(v: FogSpec | null) {
    if (!v) { this.scene.fog = null; return; }
    if (v.type === 'exp2') {
      this.scene.fog = new THREE.FogExp2(new THREE.Color(v.color), v.density ?? 0.0018);
    } else {
      this.scene.fog = new THREE.Fog(new THREE.Color(v.color), v.near ?? 0, v.far ?? 2000);
    }
  }

  get background(): string | null {
    const b = this.scene.background;
    if (b instanceof THREE.Color) return b.getHexString();
    return null;
  }

  set background(v: string | null) {
    this.scene.background = v ? new THREE.Color(v) : null;
  }

  getObjectByName(name: string): ISceneObject | undefined {
    const obj = this.scene.getObjectByName(name);
    return obj ? this.wrap(obj) : undefined;
  }

  traverse(fn: (obj: ISceneObject) => void): void {
    this.scene.traverse((child) => fn(this.wrap(child)));
  }
}

export function createPointMaterial(opts: {
  size: number;
  color: string;
  opacity?: number;
  blending?: THREE.Blending;
  transparent?: boolean;
  depthWrite?: boolean;
  vertexColors?: boolean;
}): IMaterial {
  const mat = new THREE.PointsMaterial({
    size: opts.size,
    color: new THREE.Color(opts.color),
    opacity: opts.opacity ?? 1,
    blending: opts.blending ?? THREE.NormalBlending,
    transparent: opts.transparent ?? false,
    depthWrite: opts.depthWrite ?? true,
    vertexColors: opts.vertexColors ?? false,
  });
  return { _vendor: mat, dispose: () => mat.dispose() } as any;
}

export function createBasicMaterial(opts: {
  color?: string;
  vertexColors?: boolean;
  transparent?: boolean;
  opacity?: number;
  side?: number;
}): IMaterial {
  const opts_: Record<string, unknown> = {
    vertexColors: opts.vertexColors ?? false,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: (opts.side ?? THREE.FrontSide) as any,
  };
  if (opts.color) opts_.color = new THREE.Color(opts.color);
  const mat = new THREE.MeshBasicMaterial(opts_ as any);
  return { _vendor: mat, dispose: () => mat.dispose() } as any;
}
