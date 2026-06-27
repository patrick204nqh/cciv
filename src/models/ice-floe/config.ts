import type { ModelConfig } from '../../model/types';

export default {
  materialOverrides: {
    floe: { color: 0xd0e0e8, roughness: 0.6, metalness: 0.1 },
    chunks: { color: 0xbfd0d8, roughness: 0.65, metalness: 0.05 },
  },
} satisfies ModelConfig;
