import { describe, it, expect, beforeEach } from 'vitest';
import { PolyHeavenProvider } from './polyhaven';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('PolyHeavenProvider', () => {
  let provider: PolyHeavenProvider;

  beforeEach(() => {
    provider = new PolyHeavenProvider();
  });

  it('has id "polyhaven"', () => {
    expect(provider.id).toBe('polyhaven');
  });

  it('throws when reference not found', async () => {
    const testDir = join(tmpdir(), 'polyhaven-test-' + Date.now());
    mkdirSync(testDir, { recursive: true });
    await expect(provider.pull('nonexistent-asset', testDir)).rejects.toThrow('not found');
  });
});
