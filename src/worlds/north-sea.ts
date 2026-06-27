import type { WorldConfig } from './types';

export const northSea: WorldConfig = {
  id: 'north-sea',
  models: [
    { ref: 'ship', at: [0, 0, 0], scale: 2.7 },
    { ref: 'buoy', at: [60, 0, 35] },
    { ref: 'buoy', at: [-55, 0, -25] },
    { ref: 'island', at: [-200, 0, -150] },
  ],
  environment: {
    ocean: true,
    sky: true,
    lighting: 'day',
  },
};
