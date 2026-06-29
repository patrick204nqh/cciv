import { describe, it, expect, beforeEach } from 'vitest';
import { GlbLoader } from './glb-loader';

describe('GlbLoader', () => {
  let loader: GlbLoader;

  beforeEach(() => {
    loader = new GlbLoader();
  });

  it('creates loader instance', () => {
    expect(loader).toBeDefined();
  });

  it('accepts draco decoder path', () => {
    loader.setDracoDecoderPath('/draco/');
    // Method exists and doesn't throw
  });
});
