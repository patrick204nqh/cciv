import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { writeModelData } from './_write';

function generateFloe(): THREE.BufferGeometry {
  const verts = 14;
  const baseRadius = 5;
  const points: THREE.Vector2[] = [];
  for (let i = 0; i < verts; i++) {
    const angle = (i / verts) * Math.PI * 2;
    const r = baseRadius + (Math.random() - 0.5) * 2.5;
    const jitter = 0.3;
    points.push(new THREE.Vector2(
      Math.cos(angle) * r + (Math.random() - 0.5) * jitter,
      Math.sin(angle) * r + (Math.random() - 0.5) * jitter,
    ));
  }
  const shape = new THREE.Shape(points);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.6,
    bevelEnabled: true,
    bevelThickness: 0.15,
    bevelSize: 0.1,
    bevelSegments: 2,
  });

  // Add height variation to top vertices
  // The extrude creates vertices where top face is at z=0 and bottom at z=-depth
  const pos = geo.attributes.position;
  const vertCount = pos.count;
  // Find top face vertices (z ≈ 0)
  for (let i = 0; i < vertCount; i++) {
    const z = pos.getZ(i);
    if (Math.abs(z) < 0.01) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const heightVar = Math.sin(dist * 1.2) * 0.15 + (Math.random() - 0.5) * 0.15;
      pos.setZ(i, heightVar);
    }
  }

  // Rotate to Y-up: extrude is along Z, we need it along Y
  geo.rotateX(Math.PI / 2);
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function generateChunk(radius: number, thickness: number, offsetAngle: number, offsetDist: number): THREE.BufferGeometry {
  const verts = 5 + Math.floor(Math.random() * 3);
  const points: THREE.Vector2[] = [];
  for (let j = 0; j < verts; j++) {
    const angle = (j / verts) * Math.PI * 2;
    const r = radius * (0.7 + Math.random() * 0.3);
    points.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
  }
  const shape = new THREE.Shape(points);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.03,
    bevelSegments: 1,
  });
  geo.rotateX(Math.PI / 2);
  geo.translate(Math.cos(offsetAngle) * offsetDist, 0, Math.sin(offsetAngle) * offsetDist);
  geo.computeVertexNormals();
  return geo;
}

function generateChunks(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  const count = 4;
  for (let i = 0; i < count; i++) {
    const r = 0.5 + Math.random() * 1.2;
    const thick = 0.2 + Math.random() * 0.3;
    const angle = Math.random() * Math.PI * 2;
    const dist = 6 + Math.random() * 2;
    geos.push(generateChunk(r, thick, angle, dist));
  }
  return mergeGeometries(geos);
}

function main() {
  console.log('Building ice-floe...');
  const floe = generateFloe();
  const chunks = generateChunks();
  writeModelData('ice-floe', { floe, chunks });
  console.log('Done.');
}

main();
