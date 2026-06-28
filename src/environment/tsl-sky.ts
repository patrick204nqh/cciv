import * as THREE from 'three';
import {
  Fn, vec3, float, positionWorld, normalize, mix, smoothstep,
} from 'three/tsl';
import MeshBasicNodeMaterial from 'three/src/materials/nodes/MeshBasicNodeMaterial.js';

export function createTSLSkyMaterial(): THREE.Material {
  const colorNode = Fn(() => {
    const dir = normalize(positionWorld);
    const y = dir.y;

    const top = vec3(float(0.15), float(0.25), float(0.50));
    const bottom = vec3(float(0.55), float(0.75), float(0.90));
    const horizon = vec3(float(0.85), float(0.75), float(0.60));

    const heightT = smoothstep(float(-1), float(1), y);
    const horizonGlow = smoothstep(float(-0.15), float(0), y).mul(
      smoothstep(float(0.15), float(0), y)
    );

    const gradColor = mix(bottom, top, heightT);
    const finalColor = mix(gradColor, horizon, horizonGlow);

    return finalColor;
  })();

  const material = new MeshBasicNodeMaterial();
  material.colorNode = colorNode;
  material.side = THREE.BackSide;
  material.fog = false;

  return material;
}
