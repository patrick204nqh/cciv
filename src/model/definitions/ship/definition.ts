import type { ModelDefinition } from '../../types';

import hullPos from './data/hull_pos.json';
import hullNml from './data/hull_nml.json';
import hullUv from './data/hull_uv.json';
import hullIdx from './data/hull_idx.json';

import deckPos from './data/deck_pos.json';
import deckNml from './data/deck_nml.json';
import deckUv from './data/deck_uv.json';
import deckIdx from './data/deck_idx.json';

import sailsPos from './data/sails_pos.json';
import sailsNml from './data/sails_nml.json';
import sailsUv from './data/sails_uv.json';
import sailsIdx from './data/sails_idx.json';

import riggingPos from './data/rigging_pos.json';
import riggingNml from './data/rigging_nml.json';
import riggingUv from './data/rigging_uv.json';
import riggingIdx from './data/rigging_idx.json';

import detailsPos from './data/details_pos.json';
import detailsNml from './data/details_nml.json';
import detailsUv from './data/details_uv.json';
import detailsIdx from './data/details_idx.json';

import interiorPos from './data/interior_pos.json';
import interiorNml from './data/interior_nml.json';
import interiorUv from './data/interior_uv.json';
import interiorIdx from './data/interior_idx.json';

import aftPos from './data/aft_pos.json';
import aftNml from './data/aft_nml.json';
import aftUv from './data/aft_uv.json';
import aftIdx from './data/aft_idx.json';
import aftUv2 from './data/aft_uv2.json';

const definition: ModelDefinition = {
  groups: {
    hull: {
      type: 'data', positions: hullPos, normals: hullNml, uvs: hullUv, indices: hullIdx,
      material: { color: 0x1c160e, roughness: 0.92 },
    },
    deck: {
      type: 'data', positions: deckPos, normals: deckNml, uvs: deckUv, indices: deckIdx,
      material: { color: 0x887050, roughness: 0.88, metalness: 0 },
    },
    sails: {
      type: 'data', positions: sailsPos, normals: sailsNml, uvs: sailsUv, indices: sailsIdx,
      material: { color: 0xf5edd9, roughness: 1, metalness: 0, transparent: true, alphaTest: 0.5 },
    },
    rigging: {
      type: 'data', positions: riggingPos, normals: riggingNml, uvs: riggingUv, indices: riggingIdx,
      material: { color: 0x3a2818, roughness: 0.9 },
    },
    details: {
      type: 'data', positions: detailsPos, normals: detailsNml, uvs: detailsUv, indices: detailsIdx,
      material: { color: 0x2e1c0c, roughness: 0.9 },
    },
    interior: {
      type: 'data', positions: interiorPos, normals: interiorNml, uvs: interiorUv, indices: interiorIdx,
      material: { color: 0x1a1008, roughness: 0.95, metalness: 0 },
    },
    aft: {
      type: 'data', positions: aftPos, normals: aftNml, uvs: aftUv, indices: aftIdx, uvs2: aftUv2,
      material: { color: 0x1c160e, roughness: 0.85 },
    },
  },

  transform: { scale: 2.7 },
  metadata: {
    license: 'CC0',
    sourceUrl: 'Derived from ship_pinnace (Poly Haven). All geometry from source data.',
    polyCount: 168317,
  },
};

export default definition;

export { textureConfig } from './textures';
