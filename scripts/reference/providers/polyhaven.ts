import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import type { AssetProvider, AssetBundle } from './types';

export type { AssetProvider, AssetBundle };

export class PolyHeavenProvider implements AssetProvider {
  readonly id = 'polyhaven';

  async pull(assetId: string, destDir: string): Promise<AssetBundle> {
    const refDir = join(process.cwd(), '.cache', 'references', assetId);
    if (!existsSync(refDir)) {
      throw new Error(
        `Reference '${assetId}' not found at ${refDir}. ` +
        `Run 'npm run reference:pull' first.`
      );
    }

    mkdirSync(destDir, { recursive: true });

    const srcDataDir = join(refDir, 'data');
    if (existsSync(srcDataDir)) {
      const files = readdirSync(srcDataDir);
      for (const file of files) {
        const content = readFileSync(join(srcDataDir, file), 'utf-8');
        writeFileSync(join(destDir, file), content);
      }
    }

    const srcTexDir = join(refDir, 'textures');
    if (existsSync(srcTexDir)) {
      const texDestDir = join(destDir, 'textures');
      mkdirSync(texDestDir, { recursive: true });
      const meshDirs = readdirSync(srcTexDir);
      for (const meshDir of meshDirs) {
        const meshTexDir = join(srcTexDir, meshDir);
        const files = readdirSync(meshTexDir);
        const destMeshTexDir = join(texDestDir, meshDir);
        mkdirSync(destMeshTexDir, { recursive: true });
        for (const file of files) {
          copyFileSync(join(meshTexDir, file), join(destMeshTexDir, file));
        }
      }
    }

    return {
      id: assetId,
      meshes: [],
      texturePaths: {},
      metadata: { provider: 'polyhaven', assetId },
    };
  }
}
