import type { ModelGroupPlugin, BuildResult } from '../plugin-registry';
import type { IGeometryFactory, IMaterialFactory } from '../../graphics/types';
import type { DataGroup } from '../types';
import { toIndexArray, buildPrimitiveToScene } from '../build-utils';

export const dataPlugin: ModelGroupPlugin = {
  type: 'data',
  build(config, geoFactory, matFactory) {
    const def = config as unknown as DataGroup;
    const positions = new Float32Array(def.positions);
    const normals = new Float32Array(def.normals);
    const uvs = new Float32Array(def.uvs);
    const indices = toIndexArray(def.indices);

    const geo = geoFactory.createBufferGeometry();
    geoFactory.setAttribute(geo, 'position', positions, 3);
    geoFactory.setAttribute(geo, 'normal', normals, 3);
    geoFactory.setAttribute(geo, 'uv', uvs, 2);
    if (def.uvs2) geoFactory.setAttribute(geo, 'uv2', new Float32Array(def.uvs2), 2);
    geoFactory.setIndex(geo, indices);
    const mat = matFactory.createStandardMaterial(def.material ?? {});

    return { geometry: geo, material: mat, polyCount: Math.floor(indices.length / 3) };
  },
};
