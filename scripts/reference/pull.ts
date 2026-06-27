#!/usr/bin/env tsx
// Standalone reference downloader — pulls external assets into .cache/references/
// This is NOT part of the model build pipeline. It's a one-time setup tool.
// Usage: tsx scripts/reference/pull.ts <asset-id>
//   or:  tsx scripts/reference/pull.ts (pulls all references from references.json)

import { existsSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PolyHeavenProvider } from './providers/polyhaven';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');
const REFS_DIR = join(ROOT, '.cache', 'references');

async function main() {
  const args = process.argv.slice(2);
  mkdirSync(REFS_DIR, { recursive: true });

  const provider = new PolyHeavenProvider();

  if (args.length > 0) {
    for (const assetId of args) {
      const dest = join(REFS_DIR, assetId);
      console.log(`Pulling '${assetId}' \u2192 ${dest}`);
      await provider.pull(assetId, dest);
    }
  } else {
    const refsPath = join(ROOT, 'scripts', 'references.json');
    if (!existsSync(refsPath)) {
      console.error('No references.json found and no asset IDs provided.');
      console.error('Usage: tsx scripts/reference/pull.ts <asset-id> [...more-ids]');
      process.exit(1);
    }
    const refs = JSON.parse(readFileSync(refsPath, 'utf-8'));
    for (const [assetId, cfg] of Object.entries(refs)) {
      const dest = join(REFS_DIR, assetId);
      console.log(`Pulling '${assetId}' (${(cfg as any).source}) \u2192 ${dest}`);
      await provider.pull(assetId, dest);
    }
  }

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
