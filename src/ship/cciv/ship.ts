import * as THREE from 'three';
import { buildCCIVGeometry } from './index';
import {
  createCCIVHullTexture, createCCIVDeckTexture, createCCIVSailTexture,
  createCCIVAftTexture, createCCIVRiggingTexture,
  createCCIVDetailsTexture, createCCIVInteriorTexture,
} from '../../textures';

function buildMat(texFn: () => ReturnType<typeof createCCIVHullTexture>, overrides: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  const tex = texFn();
  return new THREE.MeshStandardMaterial({
    map: tex.map,
    normalMap: tex.normalMap,
    roughnessMap: tex.roughnessMap,
    metalnessMap: tex.metalnessMap,
    roughness: 0.88,
    metalness: 0.02,
    ...overrides,
  });
}

export function createCCIVShip(): THREE.Group {
  const ship = new THREE.Group();

  const mats = {
    hull: buildMat(createCCIVHullTexture, { color: 0x1c160e, roughness: 0.92 }),
    deck: buildMat(createCCIVDeckTexture, { color: 0x887050, roughness: 0.88, metalness: 0 }),
    sails: buildMat(createCCIVSailTexture, {
      color: 0xf5edd9, roughness: 1, metalness: 0,
      alphaMap: createCCIVSailTexture().alphaMap,
      transparent: true, alphaTest: 0.5, side: THREE.DoubleSide,
    }),
    aft: buildMat(createCCIVAftTexture, { color: 0x1c160e, roughness: 0.85 }),
    rigging: buildMat(createCCIVRiggingTexture, { color: 0x3a2818, roughness: 0.9 }),
    details: buildMat(createCCIVDetailsTexture, { color: 0x2e1c0c, roughness: 0.9 }),
    interior: buildMat(createCCIVInteriorTexture, { color: 0x1a1008, roughness: 0.95, metalness: 0 }),
  };

  const meshNames = ['hull', 'deck', 'sails', 'aft', 'rigging', 'details', 'interior'];
  const matMap: Record<string, THREE.MeshStandardMaterial> = {
    hull: mats.hull, deck: mats.deck, sails: mats.sails,
    aft: mats.aft, rigging: mats.rigging, details: mats.details, interior: mats.interior,
  };

  for (const name of meshNames) {
    const geo = buildCCIVGeometry(name);
    const mesh = new THREE.Mesh(geo, matMap[name]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    ship.add(mesh);
  }

  // Scale to roughly match HMS Beagle dimensions (L≈90)
  ship.scale.set(2.7, 2.7, 2.7);
  return ship;
}
