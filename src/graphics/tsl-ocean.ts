import * as THREE from 'three';
import {
  time, positionLocal, cameraPosition, positionWorld, normalWorld,
  vec3, vec4, float, Fn, Loop,
  sin, cos, dot, length, normalize, mix, clamp, pow,
  uniformArray, color, vertexColor,
} from 'three/tsl';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import type { OceanConfig } from './types';
import { createWaveField, createGerstnerPositionFn, createGerstnerNormalFn } from './tsl-fft';
import type { WaveField } from './tsl-fft';

export function createTSLOceanMesh(
  geometry: THREE.BufferGeometry,
  config: OceanConfig,
  waveField?: WaveField,
): { mesh: THREE.Mesh; nodeMaterial: MeshStandardNodeMaterial } {
  const wf = waveField ?? createWaveField(config.fft, config.waves);

  const waterColorHex = new THREE.Color(config.color).getHex();

  const positionFn: any = createGerstnerPositionFn(wf);
  const normalFn: any = createGerstnerNormalFn(wf);

  const fresnel: any = Fn(([cosTheta, f0]: [any, any]) => {
    return f0.add(float(1).sub(f0).mul(pow(float(1).sub(cosTheta), float(5))));
  });

  const surfaceColor: any = Fn(() => {
    const n = normalFn();
    const v = normalize(cameraPosition.sub(positionWorld));
    const ndotv = dot(n, v).clamp(0, 1);
    const f = fresnel(ndotv, float(0.02));
    const viewFactor = float(1).sub(f);

    const dist = length(positionWorld.xz).mul(0.002).clamp(0, 1);
    const shallowColor = color(0x40c0e0);
    const deepColor = color(0x002040);
    const depthColor = mix(shallowColor, deepColor, dist);

    return depthColor.mul(viewFactor);
  });

  const hasColors = geometry.attributes.color !== undefined;

  const material = new MeshStandardNodeMaterial();
  material.positionNode = positionFn(positionLocal);
  material.normalNode = normalFn();
  material.colorNode = surfaceColor();
  material.roughness = 0.05;
  material.metalness = 0;
  material.envMapIntensity = 1.0;
  material.side = THREE.DoubleSide;
  if (hasColors) {
    const clipAlpha = vertexColor().z;
    material.opacityNode = clipAlpha;
    material.transparent = true;
  }

  const mesh = new THREE.Mesh(geometry, material);
  return { mesh, nodeMaterial: material };
}
