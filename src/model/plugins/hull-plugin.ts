import type { ModelGroupPlugin, BuildResult } from '../plugin-registry';
import type { IGeometryFactory, IMaterialFactory } from '../../graphics/types';
import type { HullGroup } from '../types';
import { buildPrimitiveToScene } from '../build-utils';
import { buildHull } from '../../primitives/hull';

export const hullPlugin: ModelGroupPlugin = {
  type: 'hull',
  build(config, geoFactory, matFactory) {
    const def = config as unknown as HullGroup;
    const data = buildHull(def.stations, {
      subdivisions: def.subdivisions,
      stationSubdivisions: def.stationSubdivisions,
    });
    return buildPrimitiveToScene(
      data.positions, data.normals, data.uvs, data.indices,
      def.material ?? {},
      geoFactory, matFactory,
    );
  },
};
