import type { ISceneObject } from '../graphics/types';

export function applyMeshTexture(
  root: ISceneObject,
  meshName: string,
  textureType: string,
  texture: any,
): void {
  const vendor: any = (root as any)._obj;
  if (!vendor || typeof vendor.traverse !== 'function') return;
  vendor.traverse((child: any) => {
    if (child.isMesh && child.name === meshName) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m: any) => { m[textureType] = texture; m.needsUpdate = true; });
      } else {
        child.material[textureType] = texture;
        child.material.needsUpdate = true;
      }
    }
  });
}

export function applyMeshTextureRepeat(
  root: ISceneObject,
  meshName: string,
  textureType: string,
  repeatX: number,
  repeatY: number,
): void {
  const vendor: any = (root as any)._obj;
  if (!vendor || typeof vendor.traverse !== 'function') return;
  vendor.traverse((child: any) => {
    if (child.isMesh && child.name === meshName) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of mats) {
        const tex = mat[textureType];
        if (tex) {
          tex.wrapS = tex.wrapT = 1000; // RepeatWrapping
          tex.repeat.set(repeatX, repeatY);
          tex.needsUpdate = true;
        }
      }
    }
  });
}
