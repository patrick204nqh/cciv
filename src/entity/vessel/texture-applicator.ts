import type { ModelEntity } from '../../model/types';
import type { IScene } from '../../graphics/types';
import { generateGroupTextures } from '../../model/definitions/ship/textures';
import { textureConfig } from '../../model/definitions/ship/definition';
import { applyMeshTexture, applyMeshTextureRepeat } from '../../util/apply-mesh-texture';

export function applyProceduralTextures(model: ModelEntity, scene: IScene): void {
  try {
    const w = 512;
    const h = 512;

    for (const [groupName, groupConfig] of Object.entries(textureConfig)) {
      const textures = generateGroupTextures(groupName, groupConfig, w, h);
      if (textures.map && scene.createCanvasTexture) {
        const tex = scene.createCanvasTexture(textures.map);
        applyMeshTexture(model.root, groupName, 'map', tex);
        const repeatX = groupName === 'hull' ? 3 : groupName === 'deck' ? 2 : 1;
        applyMeshTextureRepeat(model.root, groupName, 'map', repeatX, 1);
      }
      if (textures.alphaMap && scene.createCanvasTexture) {
        const tex = scene.createCanvasTexture(textures.alphaMap);
        applyMeshTexture(model.root, groupName, 'alphaMap', tex);
      }
    }
  } catch {
    // Canvas not available (headless/test environment) — skip procedural textures.
  }
}
