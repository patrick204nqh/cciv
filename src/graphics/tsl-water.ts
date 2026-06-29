import * as THREE from 'three';
import {
  time, positionLocal, cameraPosition, positionWorld, normalWorld,
  vec3, vec4, float, int, Fn, Loop,
  sin, cos, dot, length, normalize, mix, clamp, pow,
  uniformArray, color,
} from 'three/tsl';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import type { WaveData } from './types';

export function createTSLWaterMesh(
  geometry: THREE.BufferGeometry,
  config: { color: string; waves: WaveData[] },
): { mesh: THREE.Mesh; nodeMaterial: MeshStandardNodeMaterial } {
  const numWaves = config.waves.length;
  const useWaves = numWaves > 0;

  let dirArray: any;
  let paramArray: any;
  if (useWaves) {
    const waveDirs = config.waves.map(w =>
      new THREE.Vector4(w.direction[0], w.direction[1], w.k, w.omega),
    );
    const waveParams = config.waves.map(w =>
      new THREE.Vector4(w.amp, w.Qi, w.phase, 0),
    );
    dirArray = uniformArray(waveDirs, 'vec4');
    paramArray = uniformArray(waveParams, 'vec4');
  }

  const waterColorHex = new THREE.Color(config.color).getHex();

  const gerstnerPosition = useWaves
    ? Fn(([pos]: [any]) => {
        const p = vec3(pos);
        const disp = vec3(0);
        Loop(numWaves, ({ i }) => {
          const d = dirArray.element(i);
          const a = paramArray.element(i);
          const dir = d.xy;
          const k = d.z;
          const omega = d.w;
          const amp = a.x;
          const Qi = a.y;
          const ph = a.z;
          const arg = k.mul(dir.x.mul(p.x).add(dir.y.mul(p.z))).sub(omega.mul(time)).add(ph);
          const cosA = cos(arg);
          const sinA = sin(arg);
          disp.x.addAssign(Qi.mul(amp).mul(dir.x).mul(cosA));
          disp.z.addAssign(Qi.mul(amp).mul(dir.y).mul(cosA));
          disp.y.addAssign(amp.mul(sinA));
        });
        return p.add(disp);
      })
    : null;

  const gerstnerNormal = useWaves
    ? Fn(() => {
        const p = positionLocal;
        let dhdx = float(0);
        let dhdz = float(0);
        Loop(numWaves, ({ i }) => {
          const d = dirArray.element(i);
          const a = paramArray.element(i);
          const dir = d.xy;
          const k = d.z;
          const omega = d.w;
          const amp = a.x;
          const ph = a.z;
          const arg = k.mul(dir.x.mul(p.x).add(dir.y.mul(p.z))).sub(omega.mul(time)).add(ph);
          const deriv = amp.mul(k).mul(cos(arg));
          dhdx.addAssign(deriv.mul(dir.x));
          dhdz.addAssign(deriv.mul(dir.y));
        });
        return normalize(vec3(dhdx.negate(), float(1), dhdz.negate()));
      })
    : null;

  const fresnel = Fn(([cosTheta, f0]: [any, any]) => {
    return f0.add(float(1).sub(f0).mul(pow(float(1).sub(cosTheta), float(5))));
  });

  const surfaceColor = Fn(() => {
    const n = gerstnerNormal ? gerstnerNormal() : normalWorld;
    const v = normalize(cameraPosition.sub(positionWorld));
    const ndotv = dot(n, v).clamp(0, 1);
    const f = fresnel(ndotv, float(0.02));
    const bodyColor = color(waterColorHex);
    const viewFactor = float(1).sub(f);
    return bodyColor.mul(viewFactor);
  });

  const material = new MeshStandardNodeMaterial();
  if (gerstnerPosition) material.positionNode = gerstnerPosition(positionLocal);
  if (gerstnerNormal) material.normalNode = gerstnerNormal();
  material.colorNode = surfaceColor();
  material.roughness = 0.05;
  material.metalness = 0;
  material.envMapIntensity = 1.0;
  material.side = THREE.DoubleSide;

  const mesh = new THREE.Mesh(geometry, material);
  return { mesh, nodeMaterial: material };
}
