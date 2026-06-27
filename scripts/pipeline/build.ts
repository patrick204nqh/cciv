#!/usr/bin/env tsx
import { existsSync, readdirSync, mkdirSync, writeFileSync, copyFileSync } from 'fs';
import { join, relative } from 'path';
import type { PipelineModelConfig } from './types';

const ROOT = join(__dirname, '..', '..');
const MODELS_DIR = join(ROOT, 'src', 'models');
const CACHE_DIR = join(ROOT, '.cache', 'processed');
const RAW_DIR = join(ROOT, '.cache', 'raw');

async function buildModels(): Promise<void> {
  const modelDirs = readdirSync(MODELS_DIR).filter(d =>
    existsSync(join(MODELS_DIR, d, 'config.ts'))
  );

  for (const modelId of modelDirs) {
    const config: PipelineModelConfig = (await import(join(MODELS_DIR, modelId, 'config.ts'))).default;
    const destDir = join(CACHE_DIR, modelId);
    mkdirSync(destDir, { recursive: true });

    console.log(`[build] ${modelId}: type=${config.type}`);

    switch (config.type) {
      case 'extracted': {
        const rawDir = join(RAW_DIR, modelId);
        if (!existsSync(rawDir)) {
          console.warn(`  Raw data not found, run pull first: ${rawDir}`);
          continue;
        }
        const files = readdirSync(rawDir);
        for (const file of files) {
          const srcPath = join(rawDir, file);
          const stat = existsSync(srcPath) ? await import('fs').then(fs => fs.statSync(srcPath)) : null;
          if (stat?.isDirectory()) {
            copyRecursive(srcPath, join(destDir, file));
          } else {
            copyFileSync(srcPath, join(destDir, file));
          }
        }
        break;
      }
      case 'procedural': {
        const meta = {
          type: 'procedural',
          generator: config.generator,
          params: config.params,
          material: config.material ?? {},
        };
        writeFileSync(join(destDir, 'model.json'), JSON.stringify(meta, null, 2));
        break;
      }
      case 'composite': {
        const meta = {
          type: 'composite',
          parts: config.parts,
          transform: config.transform,
        };
        writeFileSync(join(destDir, 'model.json'), JSON.stringify(meta, null, 2));
        break;
      }
    }

    console.log(`[build] ${modelId}: done \u2192 ${relative(ROOT, destDir)}`);
  }
}

function copyRecursive(src: string, dest: string): void {
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

buildModels().catch(err => { console.error(err); process.exit(1); });
