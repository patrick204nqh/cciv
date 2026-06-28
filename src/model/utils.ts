import type { ISceneObject } from '../scene/types';

export function traverseMeshes(
  root: ISceneObject,
  fn: (mesh: ISceneObject, material: any) => void,
): void {
  root.traverseMeshes((mesh) => {
    const vendorObj = (mesh as any)._obj;
    fn(mesh, vendorObj?.material);
  });
}
