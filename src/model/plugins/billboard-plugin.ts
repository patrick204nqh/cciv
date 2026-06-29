import type { ModelGroupPlugin } from '../plugin-registry';
import type { IGeometryFactory, IMaterialFactory } from '../../graphics/types';
import type { BillboardGroup } from '../types';
import { buildPrimitiveToScene } from '../build-utils';
import { buildBillboard } from '../../primitives/billboard';

export const billboardPlugin: ModelGroupPlugin = {
  type: 'billboard',
  build(config, geoFactory, matFactory) {
    const def = config as unknown as BillboardGroup;
    const data = buildBillboard({
      width: def.width, height: def.height, origin: def.origin, belly: def.belly,
      segmentsW: def.segmentsW, segmentsH: def.segmentsH,
    });
    return buildPrimitiveToScene(
      data.positions, data.normals, data.uvs, data.indices,
      def.material ?? {},
      geoFactory, matFactory,
    );
  },
};
