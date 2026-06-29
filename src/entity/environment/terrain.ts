import type { SceneEntity } from '../types';
import type { Disposer } from '../../util/disposer';
import type { IScene } from '../../graphics/types';
import type { TerrainConfig } from '../../state/types';

export function createTerrainEntity(config: TerrainConfig): SceneEntity {
  let mesh: ReturnType<IScene['createMesh']> | null = null;

  return {
    id: 'terrain',

    onAttach(scene: IScene, disposer?: Disposer) {
      const { size, segments, heightScale, heightData, color } = config;

      const geo = scene.createPlaneGeometry(size, size, segments, segments);
      scene.setAttribute(geo, 'uv', new Float32Array(0), 2);

      const positions = scene.readAttribute(geo, 'position');
      if (positions) {
        const halfSize = size / 2;
        for (let i = 0; i < positions.length; i += 3) {
          const nx = (positions[i] + halfSize) / size;
          const nz = (positions[i + 2] + halfSize) / size;
          const ix = Math.round(nx * segments);
          const iz = Math.round(nz * segments);
          const hIndex = Math.min(ix * (segments + 1) + iz, heightData.length - 1);
          positions[i + 1] = heightData[hIndex] * heightScale;
        }
        scene.setAttribute(geo, 'position', positions, 3);
        scene.markAttributeDirty(geo, 'position');
      }

      const normals = computeTerrainNormals(positions, segments);
      if (normals) {
        scene.setAttribute(geo, 'normal', normals, 3);
        scene.markAttributeDirty(geo, 'normal');
      }

      const material = scene.createStandardMaterial({ color });
      mesh = scene.createMesh(geo, material);
      mesh.rotation.x = -Math.PI / 2;

      scene.add(mesh);
      disposer?.add(() => { mesh?.dispose(); });
    },

    onUpdate() {},

    onDetach() {
      mesh = null;
    },
  };
}

function computeTerrainNormals(positions: Float32Array | null, segments: number): Float32Array | null {
  if (!positions) return null;
  const normals = new Float32Array(positions.length);
  const stride = segments + 1;

  for (let z = 0; z < segments; z++) {
    for (let x = 0; x < segments; x++) {
      const i = (z * stride + x) * 3;
      const iR = (z * stride + x + 1) * 3;
      const iD = ((z + 1) * stride + x) * 3;

      const ax = positions[iR] - positions[i];
      const ay = positions[iR + 1] - positions[i + 1];
      const az = positions[iR + 2] - positions[i + 2];
      const bx = positions[iD] - positions[i];
      const by = positions[iD + 1] - positions[i + 1];
      const bz = positions[iD + 2] - positions[i + 2];

      const nx = ay * bz - az * by;
      const ny = az * bx - ax * bz;
      const nz = ax * by - ay * bx;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

      if (len > 0) {
        for (const idx of [i, iR, iD]) {
          normals[idx] += nx / len;
          normals[idx + 1] += ny / len;
          normals[idx + 2] += nz / len;
        }
      }
    }
  }

  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.sqrt(normals[i] * normals[i] + normals[i + 1] * normals[i + 1] + normals[i + 2] * normals[i + 2]);
    if (len > 0) {
      normals[i] /= len;
      normals[i + 1] /= len;
      normals[i + 2] /= len;
    }
  }

  return normals;
}
