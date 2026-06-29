import * as THREE from 'three';
import { Color } from 'three';
import type { IScene, ISceneObject, SceneHandle, FogSpec, IMaterial, MaterialSpec, IWater, IWaterConfig, ISkyConfig } from './types';
import { GeometryHandle } from './types';
import { SceneObject } from './object';
import { SkyMesh } from 'three/addons/objects/SkyMesh.js';
import { createTSLOceanMesh } from './tsl-ocean';
import { createClipmapGeometry } from './clipmap';
import type { ClipmapGeometry } from './clipmap';

const _registeredMaterials = new WeakMap<IMaterial, THREE.Material>();

function createGeometryHandle(geo: THREE.BufferGeometry): GeometryHandle {
  const handle = new GeometryHandle();
  handleBuffer(handle, geo);
  return handle;
}

const _geoMap = new WeakMap<GeometryHandle, THREE.BufferGeometry>();
function handleBuffer(handle: GeometryHandle, geo: THREE.BufferGeometry): void {
  _geoMap.set(handle, geo);
}
function resolveBuffer(handle: GeometryHandle): THREE.BufferGeometry {
  const geo = _geoMap.get(handle);
  if (!geo) throw new Error('Invalid geometry handle');
  return geo;
}

export class SceneAdapter implements IScene {
  private idCache = new Map<string, ISceneObject>();
  private vendorCache = new Map<THREE.Object3D, string>();
  private _envColor: string | null = null;
  private _oceanClipmap: ClipmapGeometry | null = null;

  constructor(
    private scene: THREE.Scene,
    private renderer?: any,
  ) {}

  onBeforeRender(cameraPosition: THREE.Vector3): void {
    this._oceanClipmap?.update(cameraPosition);
  }

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

  registerMaterial(material: IMaterial, vendor: any): void {
    _registeredMaterials.set(material, vendor);
  }

  createGroup(name?: string): ISceneObject {
    const group = new THREE.Group();
    if (name) group.name = name;
    return this.wrap(group);
  }

  wrapObject3D(obj: any): ISceneObject {
    return this.wrap(obj);
  }

  createWater(config: IWaterConfig, geometry?: GeometryHandle): IWater {
    let mesh: THREE.Mesh;

    if (geometry) {
      const vendorGeo = resolveBuffer(geometry);
      const result = createTSLOceanMesh(vendorGeo, config);
      mesh = result.mesh;
    } else {
      const clipmapCfg = 'clipmap' in config ? (config as any).clipmap : {
        rings: [
          { segments: 32, radius: 50 },
          { segments: 32, radius: 150 },
          { segments: 16, radius: 400 },
          { segments: 8, radius: 1500 },
        ],
        overlap: 2,
      };
      const clipmap = createClipmapGeometry(clipmapCfg);
      this._oceanClipmap = clipmap;
      const result = createTSLOceanMesh(clipmap.root, config as any);
      mesh = result.mesh;
    }

    const obj = this.wrap(mesh);
    return {
      get object() { return obj; },
      dispose: () => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this._oceanClipmap?.dispose();
        this._oceanClipmap = null;
      },
    };
  }

  createSky(config?: ISkyConfig): ISceneObject {
    const sky = new SkyMesh();
    sky.scale.setScalar(10000);
    if (config) {
      sky.turbidity.value = config.turbidity ?? 2;
      sky.rayleigh.value = config.rayleigh ?? 1;
      sky.mieCoefficient.value = config.mieCoefficient ?? 0.005;
      sky.mieDirectionalG.value = config.mieDirectionalG ?? 0.8;
      sky.sunPosition.value.set(config.sunPosition[0], config.sunPosition[1], config.sunPosition[2]);
      sky.showSunDisc.value = config.showSunDisc !== false ? 1 : 0;
      if (config.cloudCoverage != null) sky.cloudCoverage.value = config.cloudCoverage;
      if (config.cloudDensity != null) sky.cloudDensity.value = config.cloudDensity;
      if (config.cloudSpeed != null) sky.cloudSpeed.value = config.cloudSpeed;
      if (config.cloudScale != null) sky.cloudScale.value = config.cloudScale;
      if (config.cloudElevation != null) sky.cloudElevation.value = config.cloudElevation;
    }
    return this.wrap(sky);
  }

  createMesh(geometry: GeometryHandle, material: IMaterial): ISceneObject {
    const vendorMat = _registeredMaterials.get(material);
    if (!vendorMat) throw new Error('Material not registered with the scene gate');
    const vendorGeo = resolveBuffer(geometry);
    const mesh = new THREE.Mesh(vendorGeo, vendorMat);
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

  createPointLight(color: string, intensity: number, range: number, position: [number, number, number]): ISceneObject {
    const light = new THREE.PointLight(new THREE.Color(color), intensity, range);
    light.position.set(position[0], position[1], position[2]);
    return this.wrap(light);
  }

  createPlaneGeometry(width: number, height: number, segW: number, segH: number): GeometryHandle {
    const geo = new THREE.PlaneGeometry(width, height, segW, segH);
    geo.rotateX(-Math.PI / 2);
    return createGeometryHandle(geo);
  }

  createSphereGeometry(radius: number, widthSeg: number, heightSeg: number): GeometryHandle {
    return createGeometryHandle(new THREE.SphereGeometry(radius, widthSeg, heightSeg));
  }

  createPoints(geometry: GeometryHandle, material: IMaterial): ISceneObject {
    const vendorMat = _registeredMaterials.get(material);
    if (!vendorMat) throw new Error('Material not registered with the scene gate');
    const vendorGeo = resolveBuffer(geometry);
    const points = new THREE.Points(vendorGeo, vendorMat);
    return this.wrap(points);
  }

  createBufferGeometry(): GeometryHandle {
    return createGeometryHandle(new THREE.BufferGeometry());
  }

  setAttribute(geo: GeometryHandle, name: string, data: Float32Array, itemSize: number): void {
    resolveBuffer(geo).setAttribute(name, new THREE.BufferAttribute(data, itemSize));
  }

  setIndex(geo: GeometryHandle, data: Uint16Array | Uint32Array): void {
    resolveBuffer(geo).setIndex(new THREE.BufferAttribute(data, 1));
  }

  markAttributeDirty(geo: GeometryHandle, name: string): void {
    const attr = resolveBuffer(geo).attributes[name];
    if (attr) attr.needsUpdate = true;
  }

  readAttribute(geo: GeometryHandle, name: string): Float32Array | null {
    const attr = resolveBuffer(geo).attributes[name];
    if (!attr) return null;
    return attr.array instanceof Float32Array ? attr.array : new Float32Array(attr.array);
  }

  createStandardMaterial(spec: MaterialSpec): IMaterial {
    const mat = new THREE.MeshStandardMaterial();
    if (spec.color != null) {
      const c = typeof spec.color === 'number' ? spec.color : parseInt(spec.color.replace('#', ''), 16);
      mat.color.setHex(c);
    }
    if (spec.roughness != null) mat.roughness = spec.roughness;
    if (spec.metalness != null) mat.metalness = spec.metalness;
    if (spec.transparent) mat.transparent = true;
    if (spec.alphaTest != null) { mat.alphaTest = spec.alphaTest; }
    if (spec.side != null) mat.side = spec.side;
    const handle: IMaterial = {
      color: typeof spec.color === 'number' ? `#${spec.color.toString(16).padStart(6, '0')}` : spec.color,
      roughness: spec.roughness ?? 1,
      metalness: spec.metalness ?? 0,
      opacity: 1,
      transparent: spec.transparent ?? false,
      side: spec.side ?? THREE.FrontSide,
      dispose: () => mat.dispose(),
    };
  _registeredMaterials.set(handle, mat);
  return handle;
}

  createCanvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
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

  get environment(): string | null {
    return this._envColor;
  }

  set environment(color: string | null) {
    this._envColor = color;
  }

  flushEnvironment(): void {
    if (!this._envColor) {
      this.scene.environment = null;
      return;
    }
    const glRenderer = new THREE.WebGLRenderer({ antialias: false });
    glRenderer.setSize(16, 16);
    const pmrem = new THREE.PMREMGenerator(glRenderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(this._envColor);
    const envTexture = pmrem.fromScene(envScene).texture;
    pmrem.dispose();
    glRenderer.dispose();
    this.scene.environment = envTexture;
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
  map?: THREE.Texture | null;
}): IMaterial {
  const mat = new THREE.PointsMaterial({
    size: opts.size,
    color: new THREE.Color(opts.color),
    opacity: opts.opacity ?? 1,
    blending: opts.blending ?? THREE.NormalBlending,
    transparent: opts.transparent ?? false,
    depthWrite: opts.depthWrite ?? true,
    vertexColors: opts.vertexColors ?? false,
    map: opts.map ?? null,
  });
  const handle: IMaterial = {
    color: opts.color,
    opacity: opts.opacity ?? 1,
    transparent: opts.transparent ?? false,
    side: THREE.FrontSide,
    roughness: 1,
    metalness: 0,
    dispose: () => mat.dispose(),
  };
  _registeredMaterials.set(handle, mat);
  return handle;
}

export function createStandardMaterial(spec: MaterialSpec): IMaterial {
  const mat = new THREE.MeshStandardMaterial();
  if (spec.color != null) {
    const c = typeof spec.color === 'number' ? spec.color : parseInt(spec.color.replace('#', ''), 16);
    mat.color.setHex(c);
  }
  if (spec.roughness != null) mat.roughness = spec.roughness;
  if (spec.metalness != null) mat.metalness = spec.metalness;
  if (spec.transparent) mat.transparent = true;
  if (spec.alphaTest != null) { mat.alphaTest = spec.alphaTest; }
  if (spec.side != null) mat.side = spec.side;
  const handle: IMaterial = {
    color: typeof spec.color === 'number' ? `#${spec.color.toString(16).padStart(6, '0')}` : spec.color,
    roughness: spec.roughness ?? 1,
    metalness: spec.metalness ?? 0,
    opacity: 1,
    transparent: spec.transparent ?? false,
    side: spec.side ?? THREE.FrontSide,
    dispose: () => mat.dispose(),
  };
  _registeredMaterials.set(handle, mat);
  return handle;
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
  const handle: IMaterial = {
    color: opts.color,
    opacity: opts.opacity ?? 1,
    transparent: opts.transparent ?? false,
    side: opts.side ?? THREE.FrontSide,
    roughness: 1,
    metalness: 0,
    dispose: () => mat.dispose(),
  };
  _registeredMaterials.set(handle, mat);
  return handle;
}
