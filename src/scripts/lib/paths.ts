import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
export const ROOT = join(dirname(__filename), '..', '..', '..');

export function modelDataDir(name: string): string {
  return join(ROOT, 'src', 'models', name, 'data');
}

export function modelTexDir(name: string): string {
  return join(ROOT, 'public', 'textures', name);
}

export function glbOutPath(name: string): string {
  return join(ROOT, 'public', 'models', `${name}.glb`);
}
