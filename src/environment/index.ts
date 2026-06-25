import * as THREE from 'three';
import { M } from '../materials';

export function buildEnvironment(scene: THREE.Scene): void {
  const og = new THREE.PlaneGeometry(1800, 1800, 48, 48);
  const op = og.attributes.position;
  for (let i = 0; i < op.count; i++) {
    const x = op.getX(i), y = op.getY(i);
    op.setZ(i, Math.sin(x * 0.055) * 0.9 + Math.cos(y * 0.044 + 0.8) * 0.7 + Math.sin((x + y) * 0.02) * 1.1);
  }
  og.computeVertexNormals();
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
}
