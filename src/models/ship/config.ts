import type { ExtractedModelDef } from '../../model/types';

const shipConfig: ExtractedModelDef = {
  type: 'extracted',
  provider: 'polyhaven',
  asset: 'ship_pinnace',
  textureKeys: {
    hull: 'ccivHull',
    deck: 'ccivDeck',
    sails: 'ccivSail',
    aft: 'ccivAft',
    rigging: 'ccivRigging',
    details: 'ccivDetails',
    interior: 'ccivInterior',
  },
  transform: { scale: 2.7 },
  materialOverrides: {
    hull: { color: 0x1c160e, roughness: 0.92 },
    deck: { color: 0x887050, roughness: 0.88, metalness: 0 },
    sails: { color: 0xf5edd9, roughness: 1, metalness: 0, transparent: true, alphaTest: 0.5 },
    aft: { color: 0x1c160e, roughness: 0.85 },
    rigging: { color: 0x3a2818, roughness: 0.9 },
    details: { color: 0x2e1c0c, roughness: 0.9 },
    interior: { color: 0x1a1008, roughness: 0.95, metalness: 0 },
  },
  metadata: {
    license: 'CC0',
    sourceUrl: 'Reference: ship_pinnace',
    polyCount: 168317,
  },
};

export default shipConfig;
