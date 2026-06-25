import * as THREE from 'three';
import { M } from '../materials';

export function buildEnvironment(scene: THREE.Scene): THREE.Mesh {
  const seg = 64;
  const og = new THREE.PlaneGeometry(1800, 1800, seg, seg);
  const positions = og.attributes.position.array as Float32Array;
  const baseHeights = new Float32Array(positions.length / 3);
  for (let i = 0; i < positions.length / 3; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1];
    baseHeights[i] = Math.sin(x * 0.055) * 0.9 + Math.cos(y * 0.044 + 0.8) * 0.7 + Math.sin((x + y) * 0.02) * 1.1;
    positions[i * 3 + 2] = baseHeights[i];
  }
  og.computeVertexNormals();
  (og as any).userData = { baseHeights };
  const ocean = new THREE.Mesh(og, M.water);
  ocean.rotation.x = -Math.PI / 2; ocean.position.y = -0.35;
  ocean.receiveShadow = true; scene.add(ocean);

  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(900, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0x0e1c2a, side: THREE.BackSide })
  ));

  const hg = new THREE.Mesh(
    new THREE.CylinderGeometry(850, 850, 120, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x1a3a50, side: THREE.BackSide, transparent: true, opacity: 0.45 })
  );
  hg.position.y = -60; scene.add(hg);

  return ocean;
}
