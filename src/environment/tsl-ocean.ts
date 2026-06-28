import { MeshPhysicalNodeMaterial, TSL } from 'three/webgpu';
import type { ComputedWave } from './wave-config';
const {
  Fn, vec3, float, sin, cos, time, positionLocal, normalize,
} = TSL;

export function createTSLOceanMaterial(waves: ComputedWave[]): MeshPhysicalNodeMaterial {
  let height = float(0);
  let dispX = float(0);
  let dispZ = float(0);
  let dhdx = float(0);
  let dhdz = float(0);

  const t = time;

  for (const w of waves) {
    const arg = positionLocal.x
      .mul(w.k * w.dir[0])
      .add(positionLocal.z.mul(w.k * w.dir[1]))
      .sub(t.mul(w.omega * w.speed))
      .add(w.phase);

    const sinA = sin(arg);
    const cosA = cos(arg);
    const c = w.Qi * w.amp;
    const ampK = w.amp * w.k;

    height = height.add(sinA.mul(w.amp)) as any;
    dispX = dispX.add(cosA.mul(c * w.dir[0])) as any;
    dispZ = dispZ.add(cosA.mul(c * w.dir[1])) as any;

    dhdx = dhdx.add(cosA.mul(ampK * w.dir[0])) as any;
    dhdz = dhdz.add(cosA.mul(ampK * w.dir[1])) as any;
  }

  const positionNode = Fn(() => {
    return vec3(
      positionLocal.x.add(dispX),
      positionLocal.y.add(height),
      positionLocal.z.add(dispZ),
    );
  })();

  const normalNode = Fn(() => {
    return normalize(vec3(dhdx.negate(), float(1), dhdz.negate()));
  })();

  const material = new MeshPhysicalNodeMaterial();
  material.positionNode = positionNode;
  material.normalNode = normalNode;
  material.color.setHex(0x083060);
  material.roughness = 0.15;
  material.metalness = 0.0;
  material.transparent = true;
  material.opacity = 0.88;
  material.envMapIntensity = 1.0;

  return material;
}
