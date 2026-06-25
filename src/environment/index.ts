import * as THREE from 'three';
import { M } from '../materials';

function buildSky(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(900, 32, 24);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = (y + 900) / 1800;
    const r = 0.035 + t * 0.12;
    const g = 0.065 + t * 0.20;
    const b = 0.125 + t * 0.30;
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
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
      color: 0x204460, side: THREE.BackSide,
      transparent: true, opacity: 0.35,
    })
  );
  ring.position.y = -65;
  return ring;
}

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

  scene.add(buildSky());
  scene.add(buildHorizonRing());

  return ocean;
}
