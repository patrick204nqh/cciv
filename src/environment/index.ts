import * as THREE from 'three';
import { sampleOcean } from './waves';
import { createWaterNormalMap, createWaterDiffuseMap } from '../textures';

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
  // bake initial flat positions as base
  const pos = geo.attributes.position.array as Float32Array;
  const baseHeights = new Float32Array(pos.length / 3);
  for (let i = 0; i < pos.length / 3; i++) {
    baseHeights[i] = pos[i * 3 + 1];
  }
  return { geo, baseHeights };
}

function buildSky(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(900, 32, 24);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = (y + 900) / 1800;
    colors[i * 3] = 0.35 + t * 0.40;
    colors[i * 3 + 1] = 0.55 + t * 0.35;
    colors[i * 3 + 2] = 0.70 + t * 0.25;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.BackSide,
  }));
}

function buildHorizonRing(): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(860, 860, 140, 32, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x6090b0, side: THREE.BackSide,
      transparent: true, opacity: 0.25,
    }),
  );
  ring.position.y = -65;
  return ring;
}

export function buildEnvironment(scene: THREE.Scene): { ocean: THREE.Mesh; basePos: Float32Array } {
  const seg = 80;
  const size = 1800;
  const { geo } = buildOceanGrid(size, seg);

  const pos = geo.attributes.position.array as Float32Array;
  const basePos = new Float32Array(pos.length);
  basePos.set(pos);

  const normTex = createWaterNormalMap();
  const diffTex = createWaterDiffuseMap();

  const oceanMat = new THREE.MeshStandardMaterial({
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

  const ocean = new THREE.Mesh(geo, oceanMat);
  ocean.position.y = -0.35;
  ocean.receiveShadow = true;
  scene.add(ocean);

  scene.add(buildSky());
  scene.add(buildHorizonRing());

  return { ocean, basePos };
}

export function updateOcean(ocean: THREE.Mesh, basePos: Float32Array, t: number): void {
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
}
