import type { ModelConfig } from '../../model/types';

export default {
  materialOverrides: {
    base: { color: 0x8b7355, roughness: 0.9, metalness: 0 },
    trunk: { color: 0x5c3a1e, roughness: 0.85, metalness: 0 },
    fronds: { color: 0x2d7a1e, roughness: 0.7, metalness: 0 },
    coconuts: { color: 0x4a3520, roughness: 0.8, metalness: 0 },
  },
} satisfies ModelConfig;
