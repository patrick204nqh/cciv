import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { writeModelData } from './_write';

function generateBase(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const rad = Math.sqrt(x * x + z * z);
    const flatY = y * 0.25;
    const edgeNoise = rad > 3 ? (Math.random() - 0.5) * 0.6 : 0;
    const ringWave = Math.sin(rad * 1.5) * 0.15;
    pos.setXYZ(i, x * (1 + edgeNoise * 0.08), flatY + ringWave + Math.abs(edgeNoise) * 0.2, z * (1 + edgeNoise * 0.08));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function generateTrunk(): THREE.BufferGeometry {
  const height = 5.5;
  const geo = new THREE.CylinderGeometry(0.2, 0.6, height, 10, 10);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = (y + height / 2) / height;
    const curve = t * t * 1.5;
    const wobble = Math.sin(y * 3) * 0.04;
    pos.setXYZ(i, x + curve + wobble, y, z + Math.cos(y * 2.5) * 0.04);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.translate(0, 1.2, 0);
  return geo;
}

function generateFrond(angle: number, tilt: number): THREE.BufferGeometry {
  const length = 3 + Math.random() * 0.8;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(length * 0.3, 0.2, 0.05),
    new THREE.Vector3(length * 0.6, -0.1, 0.1),
    new THREE.Vector3(length, -0.6, 0),
  ]);
  const tube = new THREE.TubeGeometry(curve, 8, 0.06, 4, false);
  const pos = tube.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const taper = 1 - (x / length) * 0.7;
    pos.setXYZ(i, x, y * taper, z * taper);
  }
  pos.needsUpdate = true;
  tube.computeVertexNormals();
  tube.rotateZ(tilt);
  tube.rotateY(angle);
  return tube;
}

function generateCoconuts(): THREE.BufferGeometry {
  const spheres: THREE.BufferGeometry[] = [];
  const positions: [number, number, number][] = [
    [0.05, 0.7, 0.15],
    [-0.1, 0.65, -0.1],
    [0.15, 0.5, -0.15],
  ];
  for (const [dx, dy, dz] of positions) {
    const c = new THREE.SphereGeometry(0.2, 8, 6);
    c.translate(dx, dy, dz);
    spheres.push(c);
  }
  return mergeGeometries(spheres);
}

function main() {
  console.log('Building palm-island...');

  const base = generateBase();
  const trunk = generateTrunk();

  const frondCount = 7;
  const fronds: THREE.BufferGeometry[] = [];
  for (let i = 0; i < frondCount; i++) {
    const angle = (i / frondCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const tilt = -Math.PI / 2.5 + (Math.random() - 0.5) * 0.3;
    fronds.push(generateFrond(angle, tilt));
  }

  const trunkTopY = 1.2 + 5.5 / 2;
  const trunkCurve = 1.5;
  for (const f of fronds) {
    f.translate(trunkCurve, trunkTopY, 0);
  }

  const mergedFronds = mergeGeometries(fronds);

  const coconuts = generateCoconuts();
  coconuts.translate(trunkCurve, trunkTopY - 0.1, 0);

  writeModelData('palm-island', {
    base,
    trunk,
    fronds: mergedFronds,
    coconuts,
  });

  console.log('Done.');
}

main();
