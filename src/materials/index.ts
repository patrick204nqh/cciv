import * as THREE from 'three';

export const M = {
  water: new THREE.MeshStandardMaterial({ color: 0x0a3050, roughness: 0.08, metalness: 0.08, transparent: true, opacity: 0.82 }),
} as const;
