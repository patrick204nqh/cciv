import * as THREE from 'three';
import type { ModelConfig } from '../../model/types';
import { hull, deck, sails, aft, rigging, details, interior, MODEL_INFO } from './index';

export const ccivConfig: ModelConfig = {
  id: 'cciv',
  source: 'extracted',
  transform: { scale: 2.7 },
  metadata: {
    license: MODEL_INFO.license,
    sourceUrl: MODEL_INFO.source,
    polyCount: MODEL_INFO.polyCount,
  },
  meshGroups: [
    {
      name: 'hull', type: 'extracted',
      pos: hull.pos, nml: hull.nml, uv: hull.uv, indices: hull.indices,
      textureKey: 'ccivHull',
    },
    {
      name: 'deck', type: 'extracted',
      pos: deck.pos, nml: deck.nml, uv: deck.uv, indices: deck.indices,
      textureKey: 'ccivDeck',
    },
    {
      name: 'sails', type: 'extracted',
      pos: sails.pos, nml: sails.nml, uv: sails.uv, indices: sails.indices,
      textureKey: 'ccivSail',
    },
    {
      name: 'aft', type: 'extracted',
      pos: aft.pos, nml: aft.nml, uv: aft.uv, indices: aft.indices,
      uv2: aft.uv2,
      textureKey: 'ccivAft',
    },
    {
      name: 'rigging', type: 'extracted',
      pos: rigging.pos, nml: rigging.nml, uv: rigging.uv, indices: rigging.indices,
      textureKey: 'ccivRigging',
    },
    {
      name: 'details', type: 'extracted',
      pos: details.pos, nml: details.nml, uv: details.uv, indices: details.indices,
      textureKey: 'ccivDetails',
    },
    {
      name: 'interior', type: 'extracted',
      pos: interior.pos, nml: interior.nml, uv: interior.uv, indices: interior.indices,
      textureKey: 'ccivInterior',
    },
  ],
  materialOverrides: {
    hull: { color: 0x1c160e, roughness: 0.92 },
    deck: { color: 0x887050, roughness: 0.88, metalness: 0 },
    sails: { color: 0xf5edd9, roughness: 1, metalness: 0, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide },
    aft: { color: 0x1c160e, roughness: 0.85 },
    rigging: { color: 0x3a2818, roughness: 0.9 },
    details: { color: 0x2e1c0c, roughness: 0.9 },
    interior: { color: 0x1a1008, roughness: 0.95, metalness: 0 },
  },
};
