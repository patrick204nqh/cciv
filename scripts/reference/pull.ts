#!/usr/bin/env tsx
// Clone an external reference into an owned model.
//
// 1. Downloads/caches raw assets in .cache/references/<asset>/ (throwaway)
// 2. Copies geometry data to src/models/<id>/data/ (owned, commit this)
// 3. Copies textures to public/textures/<model>/ (gitignored, pulled on setup)
//
// After cloning, the model is self-contained — delete .cache/ and it still compiles.

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PolyHeavenProvider } from './providers/polyhaven';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');
const REFS_DIR = join(ROOT, '.cache', 'references');

async function cloneModel(modelId: string, assetId: string): Promise<void> {
  const refDir = join(REFS_DIR, assetId);
  const provider = new PolyHeavenProvider();

  if (!existsSync(refDir)) {
    console.log(`  Downloading '${assetId}'...`);
    await provider.pull(assetId, refDir);
  } else {
    console.log(`  Using cached '${assetId}'`);
  }

  // 1. Clone geometry data → src/models/<id>/data/
  const srcDataDir = join(refDir, 'data');
  const dataDir = join(ROOT, 'src', 'models', modelId, 'data');
  mkdirSync(dataDir, { recursive: true });

  if (existsSync(srcDataDir)) {
    const files = readdirSync(srcDataDir);
    for (const file of files) {
      const content = readFileSync(join(srcDataDir, file), 'utf-8');
      const localName = file.replace(`${assetId}_`, '');
      const localContent = content.replace(new RegExp(`${assetId}_`, 'g'), '');
      writeFileSync(join(dataDir, localName), localContent);
    }
    console.log(`  ${files.length} data files \u2192 src/models/${modelId}/data/`);
  }

  // 2. Clone textures → public/textures/<model>/ (gitignored)
  const srcTexDir = join(refDir, 'textures');
  if (existsSync(srcTexDir)) {
    const texOutDir = join(ROOT, 'public', 'textures', modelId);
    const meshDirs = readdirSync(srcTexDir);
    for (const meshDir of meshDirs) {
      const meshTexDir = join(srcTexDir, meshDir);
      const files = readdirSync(meshTexDir);
      const destDir = join(texOutDir, meshDir);
      mkdirSync(destDir, { recursive: true });
      for (const file of files) {
        const localName = file.replace(`${assetId}_`, '');
        copyFileSync(join(meshTexDir, file), join(destDir, localName));
      }
    }
    console.log(`  Textures \u2192 public/textures/${modelId}/`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    const modelId = args[0];
    const assetId = args[1] ?? modelId;
    await cloneModel(modelId, assetId);
  } else {
    const refsPath = join(ROOT, 'scripts', 'references.json');
    if (!existsSync(refsPath)) {
      console.error('No references.json found.');
      process.exit(1);
    }
    const refs = JSON.parse(readFileSync(refsPath, 'utf-8'));
    for (const [modelId, cfg] of Object.entries(refs)) {
      console.log(`\n[${modelId}]`);
      await cloneModel(modelId, (cfg as any).asset ?? modelId);
    }
  }

  console.log('\nDone. Clone geometry is committed; textures are gitignored.');
}

main().catch(err => { console.error(err); process.exit(1); });
