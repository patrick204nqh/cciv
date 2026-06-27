#!/usr/bin/env tsx
// External reference downloader.
// Downloads external assets and converts them to structured data in .cache/models/<id>/.
// The pipeline reads from .cache/models/ — it never touches external APIs.

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PolyHeavenProvider } from './providers/polyhaven';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');
const REFS_DIR = join(ROOT, '.cache', 'references');
const MODELS_DIR = join(ROOT, '.cache', 'models');

async function pullModel(modelId: string, assetId: string): Promise<void> {
  // 1. Pull or verify raw reference
  const refDir = join(REFS_DIR, assetId);
  const provider = new PolyHeavenProvider();

  if (!existsSync(refDir)) {
    console.log(`  Downloading '${assetId}'...`);
    await provider.pull(assetId, refDir);
  } else {
    console.log(`  Using cached reference '${assetId}'`);
  }

  // 2. Copy data files to .cache/models/<id>/, stripping asset prefix
  const srcDataDir = join(refDir, 'data');
  const destDir = join(MODELS_DIR, modelId);
  mkdirSync(destDir, { recursive: true });

  if (existsSync(srcDataDir)) {
    const files = readdirSync(srcDataDir);
    for (const file of files) {
      // Rename: <asset>_<group>_<attr>.js → <group>_<attr>.js
      const content = readFileSync(join(srcDataDir, file), 'utf-8');
      const localName = file.replace(`${assetId}_`, '');
      const localContent = content.replace(new RegExp(`${assetId}_`, 'g'), '');
      writeFileSync(join(destDir, localName), localContent);
    }
    console.log(`  ${files.length} data files → .cache/models/${modelId}/`);
  }

  // 3. Copy textures to public/textures/<model>/
  const srcTexDir = join(refDir, 'textures');
  if (existsSync(srcTexDir)) {
    const texOutDir = join(ROOT, 'public', 'textures', modelId);
    const meshDirs = readdirSync(srcTexDir);
    for (const meshDir of meshDirs) {
      const meshTexDir = join(srcTexDir, meshDir);
      const files = readdirSync(meshTexDir);
      const destMeshTexDir = join(texOutDir, meshDir);
      mkdirSync(destMeshTexDir, { recursive: true });
      for (const file of files) {
        const localName = file.replace(`${assetId}_`, '');
        copyFileSync(join(meshTexDir, file), join(destMeshTexDir, localName));
      }
    }
    console.log(`  Textures → public/textures/${modelId}/`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Usage: tsx scripts/reference/pull.ts <model-id> <asset-id>
    const modelId = args[0];
    const assetId = args[1] ?? modelId;
    await pullModel(modelId, assetId);
  } else {
    // Pull all from references.json
    const refsPath = join(ROOT, 'scripts', 'references.json');
    if (!existsSync(refsPath)) {
      console.error('No references.json found.');
      process.exit(1);
    }
    const refs = JSON.parse(readFileSync(refsPath, 'utf-8'));
    for (const [modelId, cfg] of Object.entries(refs)) {
      console.log(`\n[${modelId}]`);
      await pullModel(modelId, (cfg as any).asset ?? modelId);
    }
  }

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
