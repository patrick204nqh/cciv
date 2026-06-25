import * as THREE from 'three';

export function cyl(r1: number, r2: number, h: number, seg = 8) {
  return new THREE.CylinderGeometry(r1, r2, h, seg);
}

export function box(x: number, y: number, z: number) {
  return new THREE.BoxGeometry(x, y, z);
}

export function addMesh(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(px, py, pz); m.rotation.set(rx, ry, rz);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}

export function line(pts: [number, number, number][], mat: THREE.Material, parent: THREE.Object3D) {
  const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p)));
  parent.add(new THREE.Line(g, mat));
}
