import * as CANNON from 'cannon-es'
import type { ISceneObject, Vec3Like, QuatLike } from '../graphics/types'
import type { WaveSurface } from '../environment/wave-surface'
import { HydrodynamicsSolver } from './hydrodynamics'
import { SailForceSolver } from './sail'
import { createHullCollider } from './hull-collider'
import { physicsWorld } from './world'

export interface VesselPhysicsConfig {
  hullPositions: Float32Array
  hullIndices: Uint16Array | Uint32Array
  mass: number
  maxSpeed: number
  maxThrust: number
  maxSteerTorque: number
  linearDamping: number
  angularDamping: number
  hydrodynamics: {
    density: number
    dragCoefficient: number
    slammingCoefficient: number
    addedMassFactor: number
  }
  sail: {
    area: number
    liftCoeff: number
    dragCoeff: number
  }
}

export interface VesselPhysicsState {
  position: Vec3Like
  velocity: Vec3Like
  quaternion: QuatLike
}

export class VesselPhysics {
  private body: CANNON.Body
  private hydro: HydrodynamicsSolver
  private sail: SailForceSolver | null
  private _localForce = new CANNON.Vec3()
  private _throttle = 0
  private _steer = 0
  private _windSpeed = 0
  private _windDirX = 0
  private _windDirZ = 0
  private _hasWind = false
  private _maxSpeed: number
  private _maxThrust: number
  private _maxSteerTorque: number

  constructor(config: VesselPhysicsConfig) {
    this._maxSpeed = config.maxSpeed
    this._maxThrust = config.maxThrust
    this._maxSteerTorque = config.maxSteerTorque

    const collider = createHullCollider(config.hullPositions, config.hullIndices)
    const shape = collider.asTrimesh()

    this.body = new CANNON.Body({ mass: config.mass })
    const posArr: number[] = []
    for (let i = 0; i < shape.positions.length; i++) {
      posArr.push(shape.positions[i])
    }
    this.body.addShape(new CANNON.Trimesh(posArr, Array.from(shape.indices)))
    this.body.linearDamping = config.linearDamping
    this.body.angularDamping = config.angularDamping
    this.body.updateMassProperties()
    physicsWorld._world.addBody(this.body)

    this.hydro = new HydrodynamicsSolver(config.hullPositions, config.hydrodynamics)
    this.sail = config.sail.area > 0 ? new SailForceSolver(config.sail) : null
  }

  setPosition(x: number, y: number, z: number): void {
    this.body.position.set(x, y, z)
  }

  setControls(throttle: number, steer: number): void {
    this._throttle = throttle
    this._steer = steer
  }

  setWind(speed: number, dirX: number, dirZ: number): void {
    this._windSpeed = speed
    this._windDirX = dirX
    this._windDirZ = dirZ
    this._hasWind = true
  }

  update(dt: number, waveSurface: WaveSurface): void {
    const vx = this.body.velocity.x
    const vy = this.body.velocity.y
    const vz = this.body.velocity.z
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz)
    if (speed > this._maxSpeed) {
      const scale = this._maxSpeed / speed
      this.body.velocity.set(vx * scale, vy * scale, vz * scale)
    }

    if (this._throttle !== 0) {
      this._localForce.set(0, 0, this._throttle * this._maxThrust)
      this.body.applyLocalForce(this._localForce)
    }

    if (this.sail && this._throttle > 0 && this._hasWind) {
      this.sail.apply(this.body, this._windSpeed, this._windDirX, this._windDirZ, this._throttle)
    }

    this.body.torque.set(0, this._steer * this._maxSteerTorque, 0)

    const gravity = physicsWorld._world.gravity.length()
    this.hydro.apply(this.body, waveSurface, gravity, dt)
  }

  sync(target: ISceneObject): void {
    const bp = this.body.position
    target.position.x = bp.x
    target.position.y = bp.y
    target.position.z = bp.z

    const bq = this.body.quaternion
    const sinP = 2 * (bq.w * bq.y - bq.z * bq.x)
    target.rotation.x = Math.atan2(
      2 * (bq.w * bq.x + bq.y * bq.z),
      1 - 2 * (bq.x * bq.x + bq.y * bq.y),
    )
    target.rotation.y = Math.asin(Math.max(-1, Math.min(1, sinP)))
    target.rotation.z = Math.atan2(
      2 * (bq.w * bq.z + bq.x * bq.y),
      1 - 2 * (bq.y * bq.y + bq.z * bq.z),
    )
  }

  readState(): VesselPhysicsState {
    return {
      position: {
        x: this.body.position.x,
        y: this.body.position.y,
        z: this.body.position.z,
      },
      velocity: {
        x: this.body.velocity.x,
        y: this.body.velocity.y,
        z: this.body.velocity.z,
      },
      quaternion: {
        x: this.body.quaternion.x,
        y: this.body.quaternion.y,
        z: this.body.quaternion.z,
        w: this.body.quaternion.w,
      },
    }
  }

  dispose(): void {
    physicsWorld._world.removeBody(this.body)
    this.hydro.dispose()
    this.sail?.dispose()
  }
}
