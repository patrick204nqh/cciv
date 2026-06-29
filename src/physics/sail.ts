import * as CANNON from 'cannon-es';

const AIR_DENSITY = 1.225;

export interface SailConfig {
  area: number;
  liftCoeff: number;
  dragCoeff: number;
}

export class SailForceSolver {
  constructor(private _config: SailConfig) {}

  apply(
    body: CANNON.Body,
    windSpeed: number,
    windDirX: number,
    windDirZ: number,
    throttle: number,
  ): void {
    if (throttle <= 0) return;

    const bVel = body.velocity;
    const bq = body.quaternion;

    const fwd = forward(bq);

    const wx = windDirX * windSpeed;
    const wz = windDirZ * windSpeed;

    const awx = wx - bVel.x;
    const awz = wz - bVel.z;

    const awSpeed = Math.sqrt(awx * awx + awz * awz);
    if (awSpeed < 0.5) return;

    const awDotFwd = awx * fwd.x + awz * fwd.z;

    const closeHauled = awDotFwd > 0;
    const cosAngle = closeHauled ? 0 : -awDotFwd / awSpeed;

    const efficiency = cosAngle * (1 + cosAngle) * 0.5;
    if (efficiency < 0.01) return;

    const forceMag = 0.5 * AIR_DENSITY * this._config.area * this._config.liftCoeff * awSpeed * awSpeed * efficiency;

    const nfwd = { x: fwd.x / Math.sqrt(fwd.x * fwd.x + fwd.z * fwd.z), z: fwd.z / Math.sqrt(fwd.x * fwd.x + fwd.z * fwd.z) };

    body.applyLocalForce(new CANNON.Vec3(0, 0, forceMag * throttle));
  }

  dispose(): void {}
}

function forward(q: CANNON.Quaternion): { x: number; y: number; z: number } {
  const x = 2 * (q.x * q.z + q.y * q.w);
  const y = 2 * (q.y * q.z - q.x * q.w);
  const z = 1 - 2 * (q.x * q.x + q.y * q.y);
  return { x, y, z };
}
