import type { ISceneGraph, IGeometryFactory, IMaterialFactory, GeometryHandle, IMaterial } from '../graphics/types';
import type { ModelEntity, ModelDefinition } from './types';
import { ModelGroupRegistry } from './plugin-registry';
import { dataPlugin, hullPlugin, extrudedPlugin, billboardPlugin, riggingPlugin } from './plugins/index';

const defaultRegistry = new ModelGroupRegistry();
defaultRegistry.register(dataPlugin);
defaultRegistry.register(hullPlugin);
defaultRegistry.register(extrudedPlugin);
defaultRegistry.register(billboardPlugin);
defaultRegistry.register(riggingPlugin);

export function buildModelFromDefinition(
  id: string,
  def: ModelDefinition,
  scene: ISceneGraph & IGeometryFactory & IMaterialFactory,
  registry?: ModelGroupRegistry,
): ModelEntity {
  const reg = registry ?? defaultRegistry;
  const root = scene.createGroup(id);

  for (const [groupName, groupDef] of Object.entries(def.groups)) {
    const type = (groupDef as Record<string, unknown>).type as string;
    const result = reg.build(type, groupDef as Record<string, unknown>, scene, scene);

    const mesh = scene.createMesh(result.geometry, result.material);
    mesh.name = groupName;
    root.addChild(mesh);
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
      polyCount: def.metadata?.polyCount,
    },
    dispose() {
      root.traverse((child) => child.dispose());
      root.detach();
    },
    clone() {
      return buildModelFromDefinition(id, def, scene, reg);
    },
  };
}
