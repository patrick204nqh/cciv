import type { ModelGroupPlugin } from '../plugin-registry';
import type { IGeometryFactory, IMaterialFactory } from '../../graphics/types';
import type { ExtrudedGroup } from '../types';
import { buildPrimitiveToScene } from '../build-utils';
import { buildExtruded } from '../../primitives/extruded';

export const extrudedPlugin: ModelGroupPlugin = {
  type: 'extruded',
  build(config, geoFactory, matFactory) {
    const def = config as unknown as ExtrudedGroup;
    const data = buildExtruded(def.outline, { y: def.y, yHeight: def.yHeight });
    return buildPrimitiveToScene(
      data.positions, data.normals, data.uvs, data.indices,
      def.material ?? {},
      geoFactory, matFactory,
    );
  },
};
