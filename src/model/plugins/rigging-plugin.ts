import type { ModelGroupPlugin } from '../plugin-registry';
import type { IGeometryFactory, IMaterialFactory } from '../../graphics/types';
import type { RiggingGroup } from '../types';
import { buildPrimitiveToScene } from '../build-utils';
import { buildRigging } from '../../primitives/rigging';

export const riggingPlugin: ModelGroupPlugin = {
  type: 'rigging',
  build(config, geoFactory, matFactory) {
    const def = config as unknown as RiggingGroup;
    const data = buildRigging(def.segments.map(s => ({
      from: s.from, to: s.to, radius: s.radius,
    })));
    return buildPrimitiveToScene(
      data.positions, data.normals, data.uvs, data.indices,
      def.material ?? {},
      geoFactory, matFactory,
    );
  },
};
