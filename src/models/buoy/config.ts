import type { ProceduralModelDef } from '../../../scripts/pipeline/types';

const buoyConfig: ProceduralModelDef = {
  type: 'procedural',
  generator: '../../generators/buoy',
  params: { height: 3, radius: 0.8, poleHeight: 1.5 },
  material: { color: 0xff4422, roughness: 0.6, metalness: 0 },
};

export default buoyConfig;
