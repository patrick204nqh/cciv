import * as CANNON from 'cannon-es';
import type { Vec3Like, QuatLike } from '../scene/types';
import type { BuoyancyConfig } from './types';
import type { WaveSurface } from '../environment/wave-surface';

function applyQuaternion(vx: number, vy: number, vz: number, qx: number, qy: number, qz: number, qw: number) {
  return {
    x: vx * (1 - 2 * qy * qy - 2 * qz * qz) + vy * (2 * qx * qy - 2 * qz * qw) + vz * (2 * qx * qz + 2 * qy * qw),
    y: vx * (2 * qx * qy + 2 * qz * qw) + vy * (1 - 2 * qx * qx - 2 * qz * qz) + vz * (2 * qy * qz - 2 * qx * qw),
    z: vx * (2 * qx * qz - 2 * qy * qw) + vy * (2 * qy * qz + 2 * qx * qw) + vz * (1 - 2 * qx * qx - 2 * qy * qy),
  };
}

const _cannonVec = new CANNON.Vec3();
const G = 9.82;

export class BuoyancySolver {
  private _worldVerts: Float32Array;

  constructor(
    private _localPositions: Float32Array,
    private _config: BuoyancyConfig,
  ) {
    this._worldVerts = new Float32Array(_localPositions.length);
  }

  apply(body: CANNON.Body, waveSurface: WaveSurface, gravity: number): void {
    const bp = body.position;
    const bq = body.quaternion;

    const pos = this._localPositions;
    const wv = this._worldVerts;

    for (let i = 0; i < pos.length; i += 3) {
      const rot = applyQuaternion(pos[i], pos[i + 1], pos[i + 2], bq.x, bq.y, bq.z, bq.w);
      wv[i] = rot.x + bp.x;
      wv[i + 1] = rot.y + bp.y;
      wv[i + 2] = rot.z + bp.z;
    }

    let totalDepth = 0;

    for (let i = 0; i < wv.length; i += 3) {
      const waveHeight = waveSurface.sample(wv[i], wv[i + 2]).height;
      const depth = waveHeight - wv[i + 1];
      if (depth > 0) {
        totalDepth += depth;
      }
    }

    if (totalDepth < 0.001) return;

    const totalBuoyancy = body.mass * G;

    for (let i = 0; i < wv.length; i += 3) {
      const wx = wv[i], wy = wv[i + 1], wz = wv[i + 2];
      const waveHeight = waveSurface.sample(wx, wz).height;
      const depth = waveHeight - wy;
      if (depth > 0) {
        const fraction = depth / totalDepth;
        const force = fraction * totalBuoyancy * this._config.density;
        _cannonVec.set(0, force, 0);
        body.applyForce(_cannonVec, new CANNON.Vec3(wx, wy, wz));
      }
    }
  }

  dispose(): void {}
}
