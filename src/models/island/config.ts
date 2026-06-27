import type { ProceduralModelDef } from '../../../scripts/pipeline/types';

const islandConfig: ProceduralModelDef = {
  type: 'procedural',
  generator: '../../generators/island',
  params: { radius: 40, height: 12, segments: 32 },
  material: { color: 0x4a7a3a, roughness: 0.9, metalness: 0 },
};

export default islandConfig;
