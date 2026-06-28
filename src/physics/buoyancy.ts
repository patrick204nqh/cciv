import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import type { BuoyancyConfig } from './types';
import type { WaveSurface } from '../environment/wave-surface';

const _tmpVec3 = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();
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
    _tmpQuat.set(bq.x, bq.y, bq.z, bq.w);

    const pos = this._localPositions;
    const wv = this._worldVerts;

    for (let i = 0; i < pos.length; i += 3) {
      _tmpVec3.set(pos[i], pos[i + 1], pos[i + 2]);
      _tmpVec3.applyQuaternion(_tmpQuat);
      wv[i] = _tmpVec3.x + bp.x;
      wv[i + 1] = _tmpVec3.y + bp.y;
      wv[i + 2] = _tmpVec3.z + bp.z;
    }

    let totalDepth = 0;
    const cx = 0, cy = 0, cz = 0;

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
