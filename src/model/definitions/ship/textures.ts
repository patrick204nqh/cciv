import type { GeneratedTextures } from '../../../material/types';
import { planks, deckPattern, fabric, fabricAlpha, rope, rivets, panels, compositePlanks } from '../../../material/patterns';

export interface GroupTextureConfig {
  color: number;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  alphaTest?: number;
}

export const textureConfig: Record<string, GroupTextureConfig> = {
  hull: { color: 0x1c160e, roughness: 0.92 },
  deck: { color: 0x887050, roughness: 0.88, metalness: 0 },
  sails: { color: 0xf5edd9, roughness: 1, metalness: 0, transparent: true, alphaTest: 0.5 },
  rigging: { color: 0x3a2818, roughness: 0.9 },
  details: { color: 0x2e1c0c, roughness: 0.9 },
  interior: { color: 0x1a1008, roughness: 0.95, metalness: 0 },
  aft: { color: 0x1c160e, roughness: 0.85 },
};

export function generateGroupTextures(groupName: string, config: GroupTextureConfig, width = 512, height = 512): GeneratedTextures {
  const w = width;
  const h = height;
  const result: GeneratedTextures = {};

  switch (groupName) {
    case 'hull':
      result.map = planks({ width: w, height: h, color: config.color });
      break;
    case 'deck':
      result.map = deckPattern({ width: w, height: h, color: config.color });
      break;
    case 'sails':
      result.map = fabric({ width: w, height: h, color: config.color });
      result.alphaMap = fabricAlpha({ width: w, height: h, color: config.color });
      break;
    case 'rigging':
      result.map = rope({ width: w, height: h, color: config.color });
      break;
    case 'details':
      result.map = rivets({ width: w, height: h, color: config.color, metalness: config.metalness });
      break;
    case 'interior':
      result.map = panels({ width: w, height: h, color: config.color });
      break;
    case 'aft':
      result.map = compositePlanks({ width: w, height: h, color: config.color, plankCount: 20, vertCount: 6 });
      break;
  }

  return result;
}
