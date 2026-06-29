import type { ISceneObject } from '../graphics/types'
import type { WaveSurface } from '../environment/wave-surface'
import type { StateStore } from '../state/store'
import { bus } from '../util/event-bus'
import { VesselPhysics } from './vessel-physics'
import type { VesselPhysicsConfig, VesselPhysicsState } from './vessel-physics'

export class VesselDynamics {
  private physics: VesselPhysics | null
  private _throttle = 0
  private _steer = 0

  constructor(
    root: ISceneObject,
    config: VesselPhysicsConfig,
    private vesselId: string,
    private store: StateStore,
  ) {
    this.physics = VesselPhysics.fromModel(root, config)
  }

  setControls(throttle: number, steer: number): void {
    this._throttle = throttle
    this._steer = steer
    if (this.physics) {
      this.physics.setControls(throttle, steer)
    }
  }

  update(dt: number, waveSurface: WaveSurface): void {
    if (!this.physics) return

    if (this._throttle > 0) {
      const locations = this.store.get('locations') as Record<string, any>
      const activeLoc = this.store.get('activeLocation') as string
      const env = locations[activeLoc]?.environment
      const wind = env?.wind
      if (wind) {
        const wDirX = Math.sin(wind.direction)
        const wDirZ = -Math.cos(wind.direction)
        this.physics.setWind(wind.speed, wDirX, wDirZ)
      }
    }

    this.physics.update(dt, waveSurface)

    const state = this.physics.readState()
    bus.emit('entity:position-changed', {
      entityId: this.vesselId,
      x: state.position.x, y: state.position.y, z: state.position.z,
      qx: state.quaternion.x, qy: state.quaternion.y, qz: state.quaternion.z, qw: state.quaternion.w,
      vx: state.velocity.x, vy: state.velocity.y, vz: state.velocity.z,
    })
  }

  sync(target: ISceneObject): void {
    this.physics?.sync(target)
  }

  readState(): VesselPhysicsState | null {
    return this.physics?.readState() ?? null
  }

  dispose(): void {
    this.physics?.dispose()
    this.physics = null
  }
}
