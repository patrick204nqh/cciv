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
    } catch { /* fallback */ }

    catalog[modelId] = {
      glb: `/models/${modelId}.glb`,
      ...(config.metadata?.polyCount && { polyCount: config.metadata.polyCount }),
      ...(config.metadata?.license && { license: config.metadata.license }),
      ...(config.materialOverrides && { materialOverrides: config.materialOverrides }),
      ...(config.transform && { transform: config.transform }),
    };

    console.log(`[publish] ${modelId}: registered`);
  }

  const outPath = join(OUT_DIR, 'manifest.json');
  writeFileSync(outPath, JSON.stringify(catalog, null, 2));
  console.log(`\n[publish] ${Object.keys(catalog).length} models → ${outPath}`);
}

publishManifest().catch(err => { console.error(err); process.exit(1); });
