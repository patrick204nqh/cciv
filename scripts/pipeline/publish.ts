#!/usr/bin/env tsx
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ModelCatalog } from '../../src/loaders/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');
const MODELS_DIR = join(ROOT, 'src', 'models');
const OUT_DIR = join(ROOT, 'public', 'models');

async function publishManifest(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  const modelDirs = readdirSync(MODELS_DIR).filter(d =>
    existsSync(join(MODELS_DIR, d, 'config.ts'))
  );

  const catalog: ModelCatalog = {};

  for (const modelId of modelDirs) {
    const glbPath = join(OUT_DIR, `${modelId}.glb`);
    if (!existsSync(glbPath)) {
      console.warn(`[publish] ${modelId}: no .glb found, skipping`);
      continue;
    }

    let config: any = {};
    try {
      config = (await import(join(MODELS_DIR, modelId, 'config.ts'))).default ?? {};
    } catch {
      // fallback
    }

    const entry: ModelCatalog[string] = {
      glb: `/models/${modelId}.glb`,
      provider: config.type === 'extracted' ? config.provider : config.type,
    };
    if (config.metadata?.polyCount) entry.polyCount = config.metadata.polyCount;
    if (config.metadata?.license) entry.license = config.metadata.license;
    if (config.materialOverrides) entry.materialOverrides = config.materialOverrides;
    if (config.transform) entry.transform = config.transform;

    catalog[modelId] = entry;
    console.log(`[publish] ${modelId}: registered in manifest`);
  }

  const outPath = join(OUT_DIR, 'manifest.json');
  writeFileSync(outPath, JSON.stringify(catalog, null, 2));
  console.log(`\n[publish] manifest written \u2192 ${outPath} (${Object.keys(catalog).length} models)`);
}

publishManifest().catch(err => { console.error(err); process.exit(1); });
