import * as THREE from 'three';
import {
  time, positionLocal, cameraPosition, positionWorld,
  vec3, float, Fn, dot, length, normalize, mix, clamp, pow,
  color, vertexColor, exp, smoothstep,
} from 'three/tsl';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import type { OceanConfig } from './types';
import { createWaveField, createGerstnerPositionFn, createGerstnerNormalFn, createGerstnerJacobianFn } from './tsl-fft';
import type { WaveField } from './tsl-fft';
import { createFoamFn } from './tsl-foam';

export function createTSLOceanMesh(
  geometry: THREE.BufferGeometry,
  config: OceanConfig,
  waveField?: WaveField,
): { mesh: THREE.Mesh; nodeMaterial: MeshStandardNodeMaterial } {
  const wf = waveField ?? createWaveField(config.fft, config.waves);

  const positionFn: any = createGerstnerPositionFn(wf);
  const normalFn: any = createGerstnerNormalFn(wf);
  const jacobianFn: any = createGerstnerJacobianFn(wf);
  const foam: any = createFoamFn(config.foam);

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
    const t = smoothstep(float(0), float(1), dist);
    const shallowColor = color(0x40c0e0);
    const midColor = color(0x0070a0);
    const deepColor = color(0x001030);
    const bodyColor = mix(mix(shallowColor, midColor, smoothstep(float(0), float(0.3), t)), deepColor, smoothstep(float(0.3), float(1), t));

    const lightDir = vec3(0.5, 0.8, 0.3).normalize();
    const nDotL = dot(n, lightDir).max(float(0));
    const scatter = nDotL.mul(exp(dist.negate().mul(float(3))));
    const scatterColor = color(0x40e0a0).mul(scatter).mul(float(0.3));

    const jacobian = jacobianFn();
    const whitecap = foam.whitecapFoam(jacobian);
    const surfaceF = foam.surfaceNoise(positionWorld.xz);
    const totalFoam = whitecap.add(surfaceF).clamp(0, 1);
    const foamColor = color(config.foam.foamColor).mul(totalFoam);

    return bodyColor.mul(viewFactor).add(scatterColor).add(foamColor);
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
