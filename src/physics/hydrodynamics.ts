import type { WaveSurface } from '../environment/wave-surface';
import type { HydrodynamicsConfig, IPhysicsBody } from './types';

function applyQuaternion(vx: number, vy: number, vz: number, qx: number, qy: number, qz: number, qw: number) {
  return {
    x: vx * (1 - 2 * qy * qy - 2 * qz * qz) + vy * (2 * qx * qy - 2 * qz * qw) + vz * (2 * qx * qz + 2 * qy * qw),
    y: vx * (2 * qx * qy + 2 * qz * qw) + vy * (1 - 2 * qx * qx - 2 * qz * qz) + vz * (2 * qy * qz - 2 * qx * qw),
    z: vx * (2 * qx * qz - 2 * qy * qw) + vy * (2 * qy * qz + 2 * qx * qw) + vz * (1 - 2 * qx * qx - 2 * qy * qy),
  };
}

const WATER_DENSITY = 1025;

export class HydrodynamicsSolver {
  private _worldVerts: Float32Array;
  private _prevDepths: Float32Array;
  private _originalMass: number;

  constructor(
    private _localPositions: Float32Array,
    private _config: HydrodynamicsConfig,
  ) {
    this._worldVerts = new Float32Array(_localPositions.length);
    this._prevDepths = new Float32Array(_localPositions.length / 3);
    this._originalMass = 0;
  }

  apply(body: IPhysicsBody, waveSurface: WaveSurface, gravity: number, dt: number): void {
    const pos = this._localPositions;
    const wv = this._worldVerts;
    const bq = body.quaternion;
    const bp = body.position;
    const numPts = pos.length / 3;

    if (this._originalMass === 0) {
      this._originalMass = body.getMass();
    }

    for (let i = 0; i < pos.length; i += 3) {
      const rot = applyQuaternion(pos[i], pos[i + 1], pos[i + 2], bq.x, bq.y, bq.z, bq.w);
      wv[i] = rot.x + bp.x;
      wv[i + 1] = rot.y + bp.y;
      wv[i + 2] = rot.z + bp.z;
    }

    let totalDepth = 0;
    let subCount = 0;
    const depths: number[] = new Array(numPts);

    for (let i = 0; i < numPts; i++) {
      const wx = wv[i * 3], wz = wv[i * 3 + 2];
      const waveHeight = waveSurface.sample(wx, wz).height;
      const depth = waveHeight - wv[i * 3 + 1];
      depths[i] = depth;
      if (depth > 0) {
        totalDepth += depth;
        subCount++;
      }
    }

    if (totalDepth < 0.001) {
      for (let i = 0; i < numPts; i++) this._prevDepths[i] = 0;
      const resetMass = this._originalMass > 0 ? this._originalMass : body.getMass();
      if (Math.abs(body.getMass() - resetMass) > 0.01) {
        body.setMass(resetMass);
      }
      return;
    }

    const bVel = body.velocity;
    const bAVel = body.angularVelocity;
    const totalBuoyancy = body.getMass() * gravity;
    const pointWeight = 1 / subCount;

    for (let i = 0; i < numPts; i++) {
      const depth = depths[i];
      if (depth <= 0) {
        this._prevDepths[i] = 0;
        continue;
      }

      const wx = wv[i * 3], wy = wv[i * 3 + 1], wz = wv[i * 3 + 2];

      const fraction = depth / totalDepth;
      const buoyancyForce = fraction * totalBuoyancy * this._config.density;
      body.applyForce([0, buoyancyForce, 0], [wx, wy, wz]);

      const rx = wx - bp.x, ry = wy - bp.y, rz = wz - bp.z;
      const pvx = bVel.x + bAVel.y * rz - bAVel.z * ry;
      const pvy = bVel.y + bAVel.z * rx - bAVel.x * rz;
      const pvz = bVel.z + bAVel.x * ry - bAVel.y * rx;
      const vSq = pvx * pvx + pvy * pvy + pvz * pvz;

      if (vSq > 0.01) {
        const speed = Math.sqrt(vSq);
        const dragMag = 0.5 * WATER_DENSITY * this._config.dragCoefficient * depth * pointWeight * vSq;
        body.applyForce(
          [-(pvx / speed) * dragMag, -(pvy / speed) * dragMag, -(pvz / speed) * dragMag],
          [wx, wy, wz],
        );
      }

      const prevDepth = this._prevDepths[i];
      const depthRate = (depth - prevDepth) / Math.max(dt, 0.001);
      if (depthRate > 2.0 && prevDepth < 0.1) {
        const slamForce = this._config.slammingCoefficient * pointWeight * totalBuoyancy * depthRate * 0.1;
        body.applyForce([0, slamForce, 0], [wx, wy, wz]);
      }

      this._prevDepths[i] = depth;
    }

    const subVolumeFraction = totalDepth / (numPts * 5);
    const addedMass = subVolumeFraction * this._config.addedMassFactor * this._originalMass;
    const effectiveMass = this._originalMass + addedMass;
    if (Math.abs(body.getMass() - effectiveMass) > 0.01) {
      body.setMass(effectiveMass);
    }
  }

  dispose(): void {}
}
