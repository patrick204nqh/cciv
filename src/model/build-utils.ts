import type { IGeometryFactory, IMaterialFactory, GeometryHandle, IMaterial, MaterialSpec } from '../graphics/types';

export function toIndexArray(indices: number[]): Uint16Array | Uint32Array {
  let max = 0;
  for (let i = 0; i < indices.length; i++) if (indices[i] > max) max = indices[i];
  return max > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
}

export function buildPrimitiveToScene(
  positions: Float32Array,
  normals: Float32Array,
  uvs: Float32Array,
  indices: Uint16Array | Uint32Array,
  materialSpec: MaterialSpec,
  geoFactory: IGeometryFactory,
  matFactory: IMaterialFactory,
): { geometry: GeometryHandle; material: IMaterial; polyCount: number } {
  const geo = geoFactory.createBufferGeometry();
  geoFactory.setAttribute(geo, 'position', positions, 3);
  geoFactory.setAttribute(geo, 'normal', normals, 3);
  geoFactory.setAttribute(geo, 'uv', uvs, 2);
  geoFactory.setIndex(geo, indices);
  const mat = matFactory.createStandardMaterial(materialSpec);
  return { geometry: geo, material: mat, polyCount: Math.floor(indices.length / 3) };
}
