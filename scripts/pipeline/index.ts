#!/usr/bin/env tsx
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

async function main() {
  const args = process.argv.slice(2);
  const stageArg = args.find(a => a.startsWith('--stage='));
  const stage = stageArg ? stageArg.split('=')[1] : 'all';

  const stages: Record<string, string> = {
    compile: 'tsx scripts/pipeline/compile.ts',
    publish: 'tsx scripts/pipeline/publish.ts',
  };

  if (stage !== 'all') {
    runStage(stage, stages[stage]);
    return;
  }

  for (const [name, cmd] of Object.entries(stages)) {
    console.log(`\n=== Stage: ${name} ===`);
    runStage(name, cmd);
  }

  console.log('\n=== Pipeline complete ===');
}

function runStage(name: string, cmd: string): void {
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    console.error(`Stage '${name}' failed`);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
