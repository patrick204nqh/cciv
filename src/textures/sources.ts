export interface TextureSet {
  diff: string;
  nor_gl?: string;
  rough?: string;
  metal?: string;
  ao?: string;
  disp?: string;
  alpha?: string;
  wrapS?: number;
  wrapT?: number;
}

export const TEXTURES: Record<string, TextureSet> = {
  'ccivHull': {
    diff: '/textures/cciv/cciv_hull_diff_2k.jpg',
    nor_gl: '/textures/cciv/cciv_hull_nor_gl_2k.jpg',
    rough: '/textures/cciv/cciv_hull_rough_2k.jpg',
    metal: '/textures/cciv/cciv_hull_metal_2k.jpg',
    wrapS: 2,
    wrapT: 3
  },
  'ccivDeck': {
    diff: '/textures/cciv/cciv_deck_diff_2k.jpg',
    nor_gl: '/textures/cciv/cciv_deck_nor_gl_2k.jpg',
    rough: '/textures/cciv/cciv_deck_rough_2k.jpg',
    metal: '/textures/cciv/cciv_deck_metal_2k.jpg',
    wrapS: 3.5,
    wrapT: 9
  },
  'ccivSail': {
    diff: '/textures/cciv/cciv_sails_diff_2k.jpg',
    nor_gl: '/textures/cciv/cciv_sails_nor_gl_2k.jpg',
    rough: '/textures/cciv/cciv_sails_rough_2k.jpg',
    metal: '/textures/cciv/cciv_sails_metal_2k.jpg',
    alpha: '/textures/cciv/cciv_sails_alpha_2k.jpg',
    wrapS: 1,
    wrapT: 1
  },
  'ccivRigging': {
    diff: '/textures/cciv/cciv_rigging_diff_2k.jpg',
    nor_gl: '/textures/cciv/cciv_rigging_nor_gl_2k.jpg',
    rough: '/textures/cciv/cciv_rigging_rough_2k.jpg',
    metal: '/textures/cciv/cciv_rigging_metal_2k.jpg',
    wrapS: 1,
    wrapT: 2
  },
  'ccivAft': {
    diff: '/textures/cciv/cciv_aft_diff_2k.jpg',
    nor_gl: '/textures/cciv/cciv_aft_nor_gl_2k.jpg',
    rough: '/textures/cciv/cciv_aft_rough_2k.jpg',
    metal: '/textures/cciv/cciv_aft_metal_2k.jpg',
    wrapS: 1,
    wrapT: 1
  },
  'ccivDetails': {
    diff: '/textures/cciv/cciv_details_diff_2k.jpg',
    nor_gl: '/textures/cciv/cciv_details_nor_gl_2k.jpg',
    rough: '/textures/cciv/cciv_details_rough_2k.jpg',
    metal: '/textures/cciv/cciv_details_metal_2k.jpg',
    wrapS: 1,
    wrapT: 1
  },
  'ccivInterior': {
    diff: '/textures/cciv/cciv_interior_diff_2k.jpg',
    nor_gl: '/textures/cciv/cciv_interior_nor_gl_2k.jpg',
    rough: '/textures/cciv/cciv_interior_rough_2k.jpg',
    metal: '/textures/cciv/cciv_interior_metal_2k.jpg',
    wrapS: 1,
    wrapT: 1
  },
};
