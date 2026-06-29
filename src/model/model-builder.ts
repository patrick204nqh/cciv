import type { IScene, IMaterial } from '../graphics/types';
import type {
  ModelEntity, ModelDefinition, GroupDefinition,
  DataGroup, HullGroup, ExtrudedGroup, BillboardGroup, RiggingGroup, MaterialSpec,
} from './types';
import { buildHull as buildHullPrimitive } from '../primitives/hull';
import { buildExtruded as buildExtrudedPrimitive } from '../primitives/extruded';
import { buildBillboard as buildBillboardPrimitive } from '../primitives/billboard';
import { buildRigging as buildRiggingPrimitive } from '../primitives/rigging';
import type { PrimitiveData } from '../primitives/types';

function specToGate(spec: Partial<MaterialSpec> | undefined): {
  color?: number | string;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  alphaTest?: number;
} {
  if (!spec) return {};
  return {
    color: spec.color,
    roughness: spec.roughness,
    metalness: spec.metalness,
    transparent: spec.transparent,
    alphaTest: spec.alphaTest,
  };
}

function buildDataGeometry(scene: IScene, def: DataGroup): { geo: ReturnType<IScene['createBufferGeometry']>; mat: IMaterial } {
  const geo = scene.createBufferGeometry();
  scene.setAttribute(geo, 'position', new Float32Array(def.positions), 3);
  scene.setAttribute(geo, 'normal', new Float32Array(def.normals), 3);
  scene.setAttribute(geo, 'uv', new Float32Array(def.uvs), 2);
  if (def.uvs2) scene.setAttribute(geo, 'uv2', new Float32Array(def.uvs2), 2);
  scene.setIndex(geo, toIndexArray(def.indices));

  const mat = scene.createStandardMaterial(specToGate(def.material));
  return { geo, mat };
}

function buildHullGeometry(scene: IScene, def: HullGroup): { geo: ReturnType<IScene['createBufferGeometry']>; mat: IMaterial } {
  const data = buildHullPrimitive(def.stations, {
    subdivisions: def.subdivisions,
    stationSubdivisions: def.stationSubdivisions,
  });
  return primitiveToScene(scene, data, def.material);
}

function buildExtrudedGeometry(scene: IScene, def: ExtrudedGroup): { geo: ReturnType<IScene['createBufferGeometry']>; mat: IMaterial } {
  const data = buildExtrudedPrimitive(def.outline, { y: def.y, yHeight: def.yHeight });
  return primitiveToScene(scene, data, def.material);
}

function buildBillboardGeometry(scene: IScene, def: BillboardGroup): { geo: ReturnType<IScene['createBufferGeometry']>; mat: IMaterial } {
  const data = buildBillboardPrimitive({
    width: def.width, height: def.height, origin: def.origin, belly: def.belly,
    segmentsW: def.segmentsW, segmentsH: def.segmentsH,
  });
  return primitiveToScene(scene, data, def.material);
}

function buildRiggingGeometry(scene: IScene, def: RiggingGroup): { geo: ReturnType<IScene['createBufferGeometry']>; mat: IMaterial } {
  const data = buildRiggingPrimitive(def.segments.map(s => ({
    from: s.from, to: s.to, radius: s.radius,
  })));
  return primitiveToScene(scene, data, def.material);
}

function primitiveToScene(
  scene: IScene,
  data: PrimitiveData,
  materialSpec?: Partial<MaterialSpec>,
): { geo: ReturnType<IScene['createBufferGeometry']>; mat: IMaterial } {
  const geo = scene.createBufferGeometry();
  scene.setAttribute(geo, 'position', data.positions, 3);
  scene.setAttribute(geo, 'normal', data.normals, 3);
  scene.setAttribute(geo, 'uv', data.uvs, 2);
  scene.setIndex(geo, data.indices);
  const mat = scene.createStandardMaterial(specToGate(materialSpec));
  return { geo, mat };
}

function toIndexArray(indices: number[]): Uint16Array | Uint32Array {
  let max = 0;
  for (let i = 0; i < indices.length; i++) if (indices[i] > max) max = indices[i];
  return max > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
}

function computePolyCount(indices: Uint16Array | Uint32Array): number {
  return Math.floor(indices.length / 3);
}

export function buildModelFromDefinition(
  id: string,
  def: ModelDefinition,
  scene: IScene,
): ModelEntity {
  const root = scene.createGroup(id);
  let totalPolys = 0;

  for (const [groupName, groupDef] of Object.entries(def.groups)) {
    let result: { geo: ReturnType<IScene['createBufferGeometry']>; mat: IMaterial };

    switch (groupDef.type) {
      case 'data':
        result = buildDataGeometry(scene, groupDef);
        break;
      case 'hull':
        result = buildHullGeometry(scene, groupDef);
        break;
      case 'extruded':
        result = buildExtrudedGeometry(scene, groupDef);
        break;
      case 'billboard':
        result = buildBillboardGeometry(scene, groupDef);
        break;
      case 'rigging':
        result = buildRiggingGeometry(scene, groupDef);
        break;
      default:
        throw new Error(`Unknown group type: ${(groupDef as any).type}`);
    }

    const mesh = scene.createMesh(result.geo, result.mat);
    mesh.name = groupName;
    root.addChild(mesh);
    totalPolys += computePolyCount(
      'indices' in groupDef && Array.isArray((groupDef as DataGroup).indices)
        ? toIndexArray((groupDef as DataGroup).indices)
        : new Uint16Array(),
    );
  }

  if (def.transform) {
    const tf = def.transform;
    if (tf.scale != null) {
      if (typeof tf.scale === 'number') root.scale = { x: tf.scale, y: tf.scale, z: tf.scale };
      else root.scale = { x: tf.scale[0], y: tf.scale[1], z: tf.scale[2] };
    }
    if (tf.rotation) root.rotation = { x: tf.rotation[0], y: tf.rotation[1], z: tf.rotation[2] };
    if (tf.position) root.position = { x: tf.position[0], y: tf.position[1], z: tf.position[2] };
  }

  return {
    id,
    root,
    metadata: {
      id,
      source: 'code-defined',
      license: def.metadata?.license,
      sourceUrl: def.metadata?.sourceUrl,
      polyCount: def.metadata?.polyCount ?? totalPolys,
    },
    dispose() {
      root.traverse((child) => child.dispose());
      root.detach();
    },
    clone() {
      return buildModelFromDefinition(id, def, scene);
    },
  };
}
