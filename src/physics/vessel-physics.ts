import type { ISceneObject, Vec3Like } from '../graphics/types'
import type { WaveSurface } from '../environment/wave-surface'
import type { IPhysicsBody, IPhysicsWorld } from './types'
import { HydrodynamicsSolver } from './hydrodynamics'
import { SailForceSolver } from './sail'
import { createHullCollider } from './hull-collider'
import { physicsWorld } from './world'
import { extractHullData } from './hull-extractor'

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
  quaternion: Vec3Like & { w: number }
}

export class VesselPhysics {
  private body: IPhysicsBody
  private hydro: HydrodynamicsSolver
  private sail: SailForceSolver | null
  private _throttle = 0
  private _steer = 0
  private _windSpeed = 0
  private _windDirX = 0
  private _windDirZ = 0
  private _hasWind = false
  private _maxSpeed: number
  private _maxThrust: number
  private _maxSteerTorque: number
  private _world: IPhysicsWorld

  static fromModel(root: ISceneObject, config: VesselPhysicsConfig, world?: IPhysicsWorld): VesselPhysics | null {
    const hull = extractHullData(root)
    if (!hull) return null
    return new VesselPhysics({
      ...config,
      hullPositions: hull.positions,
      hullIndices: hull.indices,
    }, world)
  }

  constructor(config: VesselPhysicsConfig, world?: IPhysicsWorld) {
    this._world = world ?? physicsWorld
    this._maxSpeed = config.maxSpeed
    this._maxThrust = config.maxThrust
    this._maxSteerTorque = config.maxSteerTorque

    const collider = createHullCollider(config.hullPositions, config.hullIndices)
    const shape = collider.asTrimesh()

    this.body = this._world.createBody({
      mass: config.mass,
      shape: {
        type: 'trimesh',
        positions: shape.positions,
        indices: shape.indices,
      },
    })
    this.body.setDamping(config.linearDamping, config.angularDamping)

    this.hydro = new HydrodynamicsSolver(config.hullPositions, config.hydrodynamics)
    this.sail = config.sail.area > 0 ? new SailForceSolver(config.sail) : null
  }

  setPosition(x: number, y: number, z: number): void {
    this.body.setPosition(x, y, z)
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
    const v = this.body.velocity
    const speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
    if (speed > this._maxSpeed) {
      const scale = this._maxSpeed / speed
      this.body.setVelocity(v.x * scale, v.y * scale, v.z * scale)
    }

    if (this._throttle !== 0) {
      this.body.applyLocalForce(0, 0, this._throttle * this._maxThrust)
    }

    if (this.sail && this._throttle > 0 && this._hasWind) {
      this.sail.apply(this.body, this._windSpeed, this._windDirX, this._windDirZ, this._throttle)
    }

    this.body.setTorque(0, this._steer * this._maxSteerTorque, 0)

    this.hydro.apply(this.body, waveSurface, this._world.gravity, dt)
  }

  sync(target: ISceneObject): void {
    this.body.syncTransform(target)
  }

  readState(): VesselPhysicsState {
    return {
      position: { ...this.body.position },
      velocity: { ...this.body.velocity },
      quaternion: { ...this.body.quaternion },
    }
  }

  dispose(): void {
    this.body.dispose()
    this.hydro.dispose()
    this.sail?.dispose()
  }
}
