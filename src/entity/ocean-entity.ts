import * as THREE from 'three';
import type { SceneEntity } from './types';
import { sampleOcean } from '../environment/waves';
import { createWaterNormalMap, createWaterDiffuseMap } from '../textures';
import { worldClock } from '../time';

const WAVE_SPEED = 0.42;

function buildOceanGrid(size: number, seg: number): { geo: THREE.BufferGeometry; baseHeights: Float32Array } {
  const half = size / 2;
  const step = size / seg;
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];

  for (let iz = 0; iz <= seg; iz++) {
    for (let ix = 0; ix <= seg; ix++) {
      verts.push(-half + ix * step, 0, -half + iz * step);
      uvs.push(ix / seg, iz / seg);
    }
  }

  for (let iz = 0; iz < seg; iz++) {
    for (let ix = 0; ix < seg; ix++) {
      const a = iz * (seg + 1) + ix;
      const b = iz * (seg + 1) + ix + 1;
      const c = (iz + 1) * (seg + 1) + ix;
      const d = (iz + 1) * (seg + 1) + ix + 1;
      idx.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const pos = geo.attributes.position.array as Float32Array;
  const baseHeights = new Float32Array(pos.length / 3);
  for (let i = 0; i < pos.length / 3; i++) {
    baseHeights[i] = pos[i * 3 + 1];
  }
  return { geo, baseHeights };
}

export function createOceanEntity(): SceneEntity {
  const seg = 80;
  const size = 1800;

  let ocean: THREE.Mesh;
  let basePos: Float32Array;

  return {
    id: 'ocean',

    onAttach(scene: THREE.Scene) {
      const { geo } = buildOceanGrid(size, seg);
      const pos = geo.attributes.position.array as Float32Array;
      basePos = new Float32Array(pos.length);
      basePos.set(pos);

      const normTex = createWaterNormalMap();
      const diffTex = createWaterDiffuseMap();

      const mat = new THREE.MeshStandardMaterial({
        map: diffTex,
        normalMap: normTex,
        normalScale: new THREE.Vector2(0.6, 0.6),
        color: 0x2090d0,
        roughness: 0.15,
        metalness: 0.05,
        transparent: true,
        opacity: 0.82,
        envMapIntensity: 1.0,
      });

      ocean = new THREE.Mesh(geo, mat);
      ocean.position.y = -0.35;
      ocean.receiveShadow = true;
      scene.add(ocean);
    },

    onUpdate(_dt: number) {
      const t = worldClock.elapsed * WAVE_SPEED;
      const pos = ocean.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        const bx = basePos[i * 3];
        const bz = basePos[i * 3 + 2];
        const { height, dispX, dispZ } = sampleOcean(bx, bz, t);
        pos[i * 3] = bx + dispX;
        pos[i * 3 + 1] = height;
        pos[i * 3 + 2] = bz + dispZ;
      }
      ocean.geometry.attributes.position.needsUpdate = true;
      ocean.geometry.computeVertexNormals();
    },

    onDetach() {
      ocean.geometry.dispose();
      if (Array.isArray(ocean.material)) ocean.material.forEach(m => m.dispose());
      else ocean.material.dispose();
      ocean.removeFromParent();
    },
  };
}
