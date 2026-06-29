import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ClipmapConfig } from './types';

export interface ClipmapGeometry {
  readonly root: THREE.BufferGeometry;
  update(cameraPosition: THREE.Vector3): void;
  dispose(): void;
}

function generateRing(
  innerRadius: number,
  outerRadius: number,
  radialSegments: number,
  thetaSegments: number,
  overlap: number,
  isFirst: boolean,
  isLast: boolean,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= radialSegments; j++) {
    const r = innerRadius + (outerRadius - innerRadius) * (j / radialSegments);
    const span = outerRadius - innerRadius;
    const innerFade = isFirst ? 1 : THREE.MathUtils.smoothstep((r - innerRadius) / overlap, 0, 1);
    const outerFade = isLast ? 1 : THREE.MathUtils.smoothstep((outerRadius - r) / overlap, 0, 1);
    const alpha = innerFade * outerFade;

    for (let i = 0; i <= thetaSegments; i++) {
      const theta = (i / thetaSegments) * Math.PI * 2;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      positions.push(x, 0, z);
      uvs.push(i / thetaSegments, j / radialSegments);
      colors.push(1, 1, alpha);
    }
  }

  for (let j = 0; j < radialSegments; j++) {
    for (let i = 0; i < thetaSegments; i++) {
      const a = j * (thetaSegments + 1) + i;
      const b = a + thetaSegments + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createClipmapGeometry(config: ClipmapConfig): ClipmapGeometry {
  const ringGeos: THREE.BufferGeometry[] = [];
  let prevRadius = 0;
  const totalRings = config.rings.length;

  for (let idx = 0; idx < totalRings; idx++) {
    const ringSpec = config.rings[idx];
    const geo = generateRing(
      prevRadius,
      ringSpec.radius,
      Math.max(2, Math.round(ringSpec.segments / 2)),
      ringSpec.segments,
      config.overlap,
      idx === 0,
      idx === totalRings - 1,
    );
    ringGeos.push(geo);
    prevRadius = ringSpec.radius;
  }

  const merged = mergeGeometries(ringGeos);
  if (!merged) throw new Error('Failed to merge clipmap rings');

  const lastRingRadius = prevRadius;

  let prevSnappedX = 0;
  let prevSnappedZ = 0;

  return {
    root: merged,

    update(cameraPosition: THREE.Vector3): void {
      const dx = cameraPosition.x - prevSnappedX;
      const dz = cameraPosition.z - prevSnappedZ;

      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        const pos = merged.attributes.position;
        const array = pos.array as Float32Array;
        for (let i = 0; i < pos.count; i++) {
          array[i * 3] += dx;
          array[i * 3 + 2] += dz;
        }
        pos.needsUpdate = true;
        merged.computeBoundingSphere();
        prevSnappedX = cameraPosition.x;
        prevSnappedZ = cameraPosition.z;
      }
    },

    dispose(): void {
      merged.dispose();
      ringGeos.forEach(g => g.dispose());
    },
  };
}
