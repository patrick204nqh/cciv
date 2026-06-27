#!/usr/bin/env tsx
import { existsSync, readdirSync, mkdirSync } from 'fs';
import { join, relative } from 'path';
import { PolyHeavenProvider } from '../../src/providers/polyhaven';
import type { PipelineModelConfig } from './types';

const ROOT = join(__dirname, '..', '..');
const MODELS_DIR = join(ROOT, 'src', 'models');
const CACHE_DIR = join(ROOT, '.cache', 'raw');

async function pullModels(): Promise<void> {
  const modelDirs = readdirSync(MODELS_DIR).filter(d =>
    existsSync(join(MODELS_DIR, d, 'config.ts'))
  );

  const provider = new PolyHeavenProvider();

  for (const modelId of modelDirs) {
    const configPath = join(MODELS_DIR, modelId, 'config.ts');
    const config: PipelineModelConfig = (await import(configPath)).default ?? (await import(configPath));

    if (config.type === 'extracted') {
      console.log(`[pull] ${modelId}: pulling from provider '${config.provider}'...`);
      const destDir = join(CACHE_DIR, modelId);
      mkdirSync(destDir, { recursive: true });
      await provider.pull(config.asset, destDir);
      console.log(`[pull] ${modelId}: done \u2192 ${relative(ROOT, destDir)}`);
    } else {
      console.log(`[pull] ${modelId}: skipping (type=${config.type})`);
    }
  }
}

pullModels().catch(err => { console.error(err); process.exit(1); });
